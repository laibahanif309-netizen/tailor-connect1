const express = require('express');
const { param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController');
const { sendError } = require('../utils/response');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }
  return next();
}

router.get(
  '/',
  requireAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
    query('unreadOnly').optional().isIn(['true', 'false', '0', '1']).withMessage('unreadOnly must be true or false')
  ],
  handleValidation,
  listNotifications
);

router.patch(
  '/:id/read',
  requireAuth,
  [param('id').isUUID().withMessage('Invalid notification id')],
  handleValidation,
  markNotificationRead
);

router.post('/mark-all-read', requireAuth, markAllNotificationsRead);

module.exports = router;
