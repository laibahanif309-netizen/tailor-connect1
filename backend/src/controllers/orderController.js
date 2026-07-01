const crypto = require('crypto');
const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/response');
const { createNotificationAndEmit } = require('../services/notificationService');

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

const EXPRESS_FEE_CENTS = parseInt(process.env.EXPRESS_ORDER_FEE_CENTS || '1000', 10) || 1000;

const ORDER_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

function parsePage(value) {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseLimit(value) {
  const n = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_LIMIT;
  return Math.min(MAX_PAGE_LIMIT, n);
}

function generateOrderNumber() {
  return `TC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

const orderListInclude = {
  tailor: {
    select: {
      id: true,
      businessName: true,
      user: { select: { email: true, phone: true } }
    }
  },
  fabric: { select: { id: true, name: true, imageUrl: true, priceCents: true } },
  customer: { select: { id: true, fullName: true, email: true, username: true } }
};

const orderDetailInclude = {
  tailor: {
    select: {
      id: true,
      businessName: true,
      location: true,
      description: true,
      userId: true,
      user: { select: { email: true, phone: true, fullName: true } }
    }
  },
  fabric: true,
  customer: { select: { id: true, fullName: true, email: true, username: true, phone: true } },
  measurements: true,
  statusHistory: { orderBy: { createdAt: 'asc' } },
  review: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true
    }
  }
};

function mapOrderListItem(order, viewerRole) {
  const base = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    stitchingType: order.stitchingType,
    totalCents: order.totalCents,
    fabricPriceCents: order.fabricPriceCents,
    expressFeeCents: order.expressFeeCents,
    isExpress: order.isExpress,
    deliveryDate: order.deliveryDate,
    createdAt: order.createdAt,
    fabric: order.fabric
      ? {
          id: order.fabric.id,
          name: order.fabric.name,
          imageUrl: order.fabric.imageUrl
        }
      : null
  };
  const customerName =
    order.customer?.fullName || order.customer?.username || order.customer?.email || 'Customer';
  if (viewerRole === 'admin') {
    return {
      ...base,
      tailorName: order.tailor?.businessName ?? null,
      tailorId: order.tailor?.id ?? null,
      customerName,
      customerId: order.customer?.id ?? null
    };
  }
  if (viewerRole === 'customer') {
    return {
      ...base,
      tailorName: order.tailor?.businessName ?? null,
      tailorId: order.tailor?.id ?? null
    };
  }
  return {
    ...base,
    customerName,
    customerId: order.customer?.id ?? null
  };
}

function mapOrderDetail(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    stitchingType: order.stitchingType,
    deliveryAddress: order.deliveryAddress,
    deliveryDate: order.deliveryDate,
    specialInstructions: order.specialInstructions,
    isExpress: order.isExpress,
    fabricPriceCents: order.fabricPriceCents,
    expressFeeCents: order.expressFeeCents,
    totalCents: order.totalCents,
    cancelledAt: order.cancelledAt,
    completedAt: order.completedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    tailor: order.tailor,
    fabric: order.fabric,
    customer: order.customer,
    measurements: order.measurements,
    statusHistory: order.statusHistory,
    review: order.review
      ? {
          id: order.review.id,
          rating: order.review.rating,
          comment: order.review.comment,
          createdAt: order.review.createdAt
        }
      : null
  };
}

async function assertOrderAccess(order, user) {
  if (user.role === 'admin') return true;
  if (order.customerId === user.id) return true;
  if (user.role === 'tailor' && order.tailor?.userId === user.id) return true;
  return false;
}

const createOrder = async (req, res) => {
  try {
    const {
      tailorId,
      fabricId,
      stitchingType,
      deliveryAddress,
      deliveryDate,
      specialInstructions,
      isExpress,
      measurements
    } = req.body;

    if (!measurements || typeof measurements !== 'object' || Array.isArray(measurements)) {
      return sendError(res, 'measurements must be a non-array object', 422);
    }

    const delivery = new Date(deliveryDate);
    if (Number.isNaN(delivery.getTime())) {
      return sendError(res, 'Invalid deliveryDate', 422);
    }

    const tailor = await prisma.tailorProfile.findFirst({
      where: {
        id: tailorId,
        user: { role: 'tailor', status: 'active', deletedAt: null }
      }
    });
    if (!tailor) {
      return sendError(res, 'Tailor not found', 404);
    }

    const fabric = await prisma.fabric.findFirst({
      where: { id: fabricId, tailorId, isActive: true }
    });
    if (!fabric) {
      return sendError(res, 'Fabric not found for this tailor', 404);
    }

    const fabricPriceCents = fabric.priceCents;
    const express = Boolean(isExpress);
    const expressFeeCents = express ? EXPRESS_FEE_CENTS : 0;
    const totalCents = fabricPriceCents + expressFeeCents;

    let order;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = generateOrderNumber();
      try {
        order = await prisma.$transaction(async (tx) => {
          const created = await tx.order.create({
            data: {
              orderNumber,
              customerId: req.user.id,
              tailorId,
              fabricId: fabric.id,
              stitchingType,
              deliveryAddress: String(deliveryAddress).trim(),
              deliveryDate: delivery,
              specialInstructions: specialInstructions != null ? String(specialInstructions) : null,
              isExpress: express,
              fabricPriceCents,
              expressFeeCents,
              totalCents
            }
          });
          await tx.orderMeasurement.create({
            data: {
              orderId: created.id,
              measurementsJson: measurements
            }
          });
          await tx.orderStatusHistory.create({
            data: { orderId: created.id, status: 'pending' }
          });
          return created;
        });
        break;
      } catch (e) {
        if (e.code === 'P2002' && attempt < 4) continue;
        throw e;
      }
    }

    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: orderDetailInclude
    });
    return sendSuccess(res, 'Order created', mapOrderDetail(full), 201);
  } catch (err) {
    console.error('createOrder', err);
    return sendError(res, 'Could not create order', 500);
  }
};

const listOrders = async (req, res) => {
  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
  const statusFilter = req.query.status;
  const allowedStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  const status =
    typeof statusFilter === 'string' && allowedStatuses.includes(statusFilter) ? statusFilter : undefined;

  const where = {};
  if (status) where.status = status;

  if (req.user.role === 'customer') {
    where.customerId = req.user.id;
  } else if (req.user.role === 'tailor') {
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true }
    });
    if (!profile) {
      return sendSuccess(res, 'OK', { orders: [], total: 0, page, totalPages: 0 });
    }
    where.tailorId = profile.id;
  } else if (req.user.role === 'admin') {
    // optional filter by customerId / tailorId for admins later
  } else {
    return sendError(res, 'Forbidden', 403);
  }

  const total = await prisma.order.count({ where });
  const orders = await prisma.order.findMany({
    where,
    include: orderListInclude,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  });

  const viewerRole = req.user.role;
  const mapped = orders.map((o) => mapOrderListItem(o, viewerRole));
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return sendSuccess(res, 'OK', {
    orders: mapped,
    total,
    page,
    totalPages
  });
};

const getOrder = async (req, res) => {
  const { id } = req.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderDetailInclude
  });
  if (!order) {
    return sendError(res, 'Order not found', 404);
  }
  const ok = await assertOrderAccess(order, req.user);
  if (!ok) {
    return sendError(res, 'Forbidden', 403);
  }
  return sendSuccess(res, 'OK', mapOrderDetail(order));
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status: nextStatus } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { tailor: { select: { userId: true } } }
  });
  if (!order) {
    return sendError(res, 'Order not found', 404);
  }

  if (req.user.role !== 'admin') {
    if (req.user.role !== 'tailor' || order.tailor.userId !== req.user.id) {
      return sendError(res, 'Forbidden', 403);
    }
  }

  const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(nextStatus)) {
    return sendError(res, `Cannot transition from ${order.status} to ${nextStatus}`, 422);
  }

  const now = new Date();
  const data = { status: nextStatus };
  if (nextStatus === 'completed') data.completedAt = now;
  if (nextStatus === 'cancelled') data.cancelledAt = now;

  await prisma.$transaction([
    prisma.order.update({ where: { id }, data }),
    prisma.orderStatusHistory.create({
      data: { orderId: id, status: nextStatus }
    })
  ]);

  try {
    await createNotificationAndEmit({
      userId: order.customerId,
      actorId: req.user.role === 'tailor' ? req.user.id : null,
      type: 'order_status_changed',
      title: 'Order update',
      body: `Order ${order.orderNumber} is now ${nextStatus.replace(/_/g, ' ')}.`,
      metadata: { orderId: id, status: nextStatus }
    });
  } catch (e) {
    console.error('order status notification', e);
  }

  const full = await prisma.order.findUnique({
    where: { id },
    include: orderDetailInclude
  });
  return sendSuccess(res, 'Status updated', mapOrderDetail(full));
};

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus
};
