const express = require('express');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  listConversations,
  getMessages,
  markConversationRead,
  createConversationFromOrder
} = require('../controllers/chatController');
const { sendError } = require('../utils/response');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }
  return next();
}

router.get('/', requireAuth, listConversations);

router.post(
  '/from-order',
  requireAuth,
  [body('orderId').trim().notEmpty().withMessage('orderId is required')],
  handleValidation,
  createConversationFromOrder
);

router.patch(
  '/:conversationId/read',
  requireAuth,
  [param('conversationId').trim().notEmpty().withMessage('conversationId is required')],
  handleValidation,
  markConversationRead
);

router.get(
  '/:conversationId/messages',
  requireAuth,
  [
    param('conversationId').trim().notEmpty().withMessage('conversationId is required'),
    query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
    query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 })
  ],
  handleValidation,
  getMessages
);

module.exports = router;
