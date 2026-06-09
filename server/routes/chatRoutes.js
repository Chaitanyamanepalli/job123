const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, createConversation, sendChatMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getConversations);
router.get('/messages/:conversationId', protect, getMessages);
router.post('/messages', protect, sendMessage);
router.post('/create', protect, createConversation);
router.post('/send', protect, sendChatMessage);

module.exports = router;
