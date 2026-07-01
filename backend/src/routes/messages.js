const express = require('express');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadChatImageMiddleware } = require('../middleware/multerChatImage');
const { createMessage, uploadChatImage } = require('../controllers/chatController');
const { sendError } = require('../utils/response');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }
  return next();
}

router.post(
  '/upload-image',
  requireAuth,
  (req, res, next) => {
    uploadChatImageMiddleware(req, res, (err) => {
      if (err) {
        return sendError(res, err.message || 'Upload failed', 400);
      }
      return next();
    });
  },
  uploadChatImage
);

router.post(
  '/',
  requireAuth,
  [
    body('conversationId').trim().notEmpty().withMessage('conversationId is required'),
    body('messageType').isIn(['text', 'image']).withMessage('messageType must be text or image'),
    body('content').optional().isString(),
    body('imageUrl').optional().isString()
  ],
  handleValidation,
  createMessage
);

module.exports = router;
