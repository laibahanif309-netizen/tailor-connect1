const express = require('express');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const {
  createHomeVisit,
  listHomeVisits,
  updateHomeVisitStatus
} = require('../controllers/homeVisitController');
const { sendError } = require('../utils/response');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }
  return next();
}

const statusValues = ['pending', 'confirmed', 'completed', 'cancelled'];
const patchStatusValues = ['confirmed', 'completed', 'cancelled'];

router.post(
  '/',
  requireAuth,
  requireRole('customer'),
  [
    body('tailorId').isUUID().withMessage('tailorId must be a valid UUID'),
    body('requestedDate').isISO8601().withMessage('requestedDate must be ISO 8601'),
    body('timeSlot').trim().isLength({ min: 1, max: 120 }).withMessage('timeSlot is required'),
    body('address').trim().isLength({ min: 5, max: 500 }).withMessage('address must be 5–500 characters'),
    body('phone').trim().isLength({ min: 5, max: 40 }).withMessage('phone must be 5–40 characters'),
    body('purpose').optional({ values: 'null' }).isString().isLength({ max: 1000 })
  ],
  handleValidation,
  createHomeVisit
);

router.get(
  '/',
  requireAuth,
  requireRole('customer', 'tailor'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
    query('status').optional().isIn(statusValues).withMessage('Invalid status filter')
  ],
  handleValidation,
  listHomeVisits
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('customer', 'tailor'),
  [
    param('id').isUUID().withMessage('Invalid id'),
    body('status').isIn(patchStatusValues).withMessage('Invalid status')
  ],
  handleValidation,
  updateHomeVisitStatus
);

module.exports = router;
