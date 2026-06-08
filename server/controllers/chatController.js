const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get user conversations
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: { $in: [userId] },
    })
      .populate('participants', 'fullName email role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages in this conversation',
      });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message / Create conversation if none exists
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user._id;

    if (!recipientId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and message text are required',
      });
    }

    // 1. Find or create a conversation between sender and recipient
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
      });
    }

    // 2. Create the message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      text,
    });

    // 3. Update conversation lastMessage reference
    conversation.lastMessage = message._id;
    await conversation.save();

    // Trigger real-time message event via Socket.IO
    try {
      const { sendEventToUser } = require('../config/socket');
      sendEventToUser(recipientId, 'new_message', {
        _id: message._id,
        conversationId: conversation._id,
        senderId: message.senderId,
        text: message.text,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('Failed to send real-time chat socket event:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
};
