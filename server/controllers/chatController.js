const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Application = require('../models/Application');
const Job = require('../models/Job');

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
      .populate('recruiter', 'fullName email role')
      .populate('candidate', 'fullName email role')
      .populate('job', 'title company')
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

// @desc    Send a message / Create conversation if none exists (legacy backend route)
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
      const sender = await User.findById(senderId);
      const recipient = await User.findById(recipientId);

      const recruiterId = sender.role === 'recruiter' ? senderId : recipientId;
      const candidateId = sender.role === 'candidate' ? senderId : recipientId;

      const application = await Application.findOne({ candidateId }).sort({ appliedAt: -1 });
      const jobId = application ? application.jobId : null;

      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        recruiter: recruiterId,
        candidate: candidateId,
        job: jobId,
        application: application ? application._id : null,
      });
    }

    // 2. Create the message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      sender: senderId,
      text,
      readStatus: false,
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

// @desc    Create chat conversation based on application review trigger
// @route   POST /api/chat/create
// @access  Private
const createConversation = async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required',
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Associated job not found',
      });
    }

    const recruiterId = job.postedBy;
    const candidateId = application.candidateId;

    // Check authorization: only recruiter or candidate involved
    if (req.user._id.toString() !== recruiterId.toString() && req.user._id.toString() !== candidateId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start a conversation for this application',
      });
    }

    let conversation = await Conversation.findOne({
      recruiter: recruiterId,
      candidate: candidateId,
      job: job._id,
      application: application._id,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        recruiter: recruiterId,
        candidate: candidateId,
        job: job._id,
        application: application._id,
        participants: [recruiterId, candidateId],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation retrieved or created successfully',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message to a conversation
// @route   POST /api/chat/send
// @access  Private
const sendChatMessage = async (req, res, next) => {
  try {
    const { conversationId, text } = req.body;
    if (!conversationId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and message text are required',
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const recruiterId = conversation.recruiter.toString();
    const candidateId = conversation.candidate.toString();

    // Check authorization
    if (req.user._id.toString() !== recruiterId && req.user._id.toString() !== candidateId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this conversation',
      });
    }

    const recipientId = req.user._id.toString() === recruiterId ? candidateId : recruiterId;

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      senderId: req.user._id, // backward compatibility
      text,
      readStatus: false,
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    // Trigger real-time message event via Socket.IO
    try {
      const { sendEventToUser } = require('../config/socket');
      sendEventToUser(recipientId, 'receiveMessage', {
        _id: message._id,
        conversationId,
        sender: message.sender,
        senderId: message.senderId,
        text: message.text,
        createdAt: message.createdAt,
      });

      sendEventToUser(recipientId, 'new_message', {
        _id: message._id,
        conversationId: conversation._id,
        senderId: message.senderId,
        text: message.text,
        createdAt: message.createdAt,
      });

      // Save a notification log for recipient
      const senderUser = await User.findById(req.user._id);
      const Notification = require('../models/Notification');
      const notification = await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type: 'new_message',
        title: 'New Message Received',
        message: `${senderUser.fullName} sent you a message: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      });

      sendEventToUser(recipientId, 'notification', {
        _id: notification._id,
        type: 'new_message',
        title: notification.title,
        message: notification.message,
        isRead: false,
        createdAt: notification.createdAt,
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
  createConversation,
  sendChatMessage,
};
