const express = require('express');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { sendError } = require('../utils/response');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }
  return next();
}

const stitchingValues = ['mens', 'womens', 'childrens'];
const orderStatusValues = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

router.post(
  '/',
  requireAuth,
  requireRole('customer'),
  [
    body('tailorId').trim().notEmpty().withMessage('tailorId is required'),
    body('fabricId').trim().notEmpty().withMessage('fabricId is required'),
    body('stitchingType').isIn(stitchingValues).withMessage('Invalid stitchingType'),
    body('deliveryAddress').trim().notEmpty().withMessage('deliveryAddress is required'),
    body('deliveryDate').isISO8601().withMessage('deliveryDate must be a valid ISO 8601 date'),
    body('specialInstructions').optional({ values: 'null' }).isString(),
    body('isExpress').optional().isBoolean(),
    body('measurements').isObject().withMessage('measurements must be an object')
  ],
  handleValidation,
  createOrder
);

router.get(
  '/',
  requireAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
    query('status').optional().isIn(orderStatusValues).withMessage('Invalid status filter')
  ],
  handleValidation,
  listOrders
);

router.get(
  '/:id',
  requireAuth,
  [param('id').isUUID().withMessage('Invalid order id')],
  handleValidation,
  getOrder
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole('tailor', 'admin'),
  [
    param('id').isUUID().withMessage('Invalid order id'),
    body('status').isIn(['confirmed', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status')
  ],
  handleValidation,
  updateOrderStatus
);

module.exports = router;
