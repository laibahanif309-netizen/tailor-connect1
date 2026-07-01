const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { chat } = require('../controllers/aiAssistantController');

const router = express.Router();

router.post('/chat', requireAuth, requireRole('customer'), chat);

module.exports = router;
