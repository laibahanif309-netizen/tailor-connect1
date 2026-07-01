const express = require('express');
const { body, query } = require('express-validator');
const { validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { listReviewsForTailor, createReview } = require('../controllers/reviewController');
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
  [
    query('tailorId').isUUID().withMessage('tailorId must be a valid UUID'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50')
  ],
  handleValidation,
  listReviewsForTailor
);

router.post(
  '/',
  requireAuth,
  requireRole('customer'),
  [
    body('orderId').isUUID().withMessage('orderId must be a valid UUID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be 1–5'),
    body('comment').trim().isLength({ min: 3, max: 2000 }).withMessage('comment must be 3–2000 characters')
  ],
  handleValidation,
  createReview
);

module.exports = router;
