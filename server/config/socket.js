const socketIO = require('socket.io');

let io;
const onlineUsers = new Map(); // Maps userId (string) -> socketId (string)

const init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*', // Allow React client connection
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room - associates the socket with user ID
    socket.on('join', (userId) => {
      if (userId) {
        onlineUsers.set(userId.toString(), socket.id);
        socket.userId = userId.toString();
        console.log(`User ${userId} joined with socket ${socket.id}`);
        // Broadcast user's online status
        io.emit('user_status', { userId, status: 'online' });
      }
    });

    // Request check of online status for a list of users
    socket.on('check_online', (userIds) => {
      if (Array.isArray(userIds)) {
        const statuses = {};
        userIds.forEach(id => {
          statuses[id] = onlineUsers.has(id.toString()) ? 'online' : 'offline';
        });
        socket.emit('online_statuses', statuses);
      }
    });

    // Join a specific conversation room
    socket.on('joinConversation', (conversationId) => {
      if (conversationId) {
        socket.join(conversationId.toString());
        console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
      }
    });

    // Handle real-time sendMessage event
    socket.on('sendMessage', (messageData) => {
      if (messageData && messageData.conversationId) {
        socket.to(messageData.conversationId.toString()).emit('receiveMessage', messageData);
      }
    });

    // Handle typing indicators
    socket.on('typing', ({ conversationId, userId }) => {
      if (conversationId) {
        socket.to(conversationId.toString()).emit('typing', { conversationId, userId });
      }
    });

    socket.on('stopTyping', ({ conversationId, userId }) => {
      if (conversationId) {
        socket.to(conversationId.toString()).emit('stopTyping', { conversationId, userId });
      }
    });

    // Handle read receipts
    socket.on('messageRead', async ({ conversationId, messageId }) => {
      if (conversationId) {
        socket.to(conversationId.toString()).emit('messageRead', { conversationId, messageId });
        
        try {
          const Message = require('../models/Message');
          if (messageId) {
            await Message.findByIdAndUpdate(messageId, { $set: { readStatus: true } });
          } else if (socket.userId) {
            await Message.updateMany(
              { conversationId, sender: { $ne: socket.userId }, readStatus: false },
              { $set: { readStatus: true } }
            );
          }
        } catch (err) {
          console.error('Failed to update message read status in DB via socket:', err.message);
        }
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        console.log(`User ${disconnectedUserId} went offline`);
        io.emit('user_status', { userId: disconnectedUserId, status: 'offline' });
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized yet!');
  }
  return io;
};

// Send real-time event helper
const sendEventToUser = (recipientId, eventName, payload) => {
  if (!io) return;
  const socketId = onlineUsers.get(recipientId.toString());
  if (socketId) {
    io.to(socketId).emit(eventName, payload);
    console.log(`Socket sent event ${eventName} to user ${recipientId}`);
  } else {
    console.log(`Socket user ${recipientId} is offline, event not sent directly`);
  }
};

module.exports = {
  init,
  getIO,
  sendEventToUser,
  onlineUsers,
};
