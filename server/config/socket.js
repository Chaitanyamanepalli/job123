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
