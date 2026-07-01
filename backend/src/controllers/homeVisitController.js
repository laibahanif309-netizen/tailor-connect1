const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/response');
const { createNotificationAndEmit } = require('../services/notificationService');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parsePage(value) {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_PAGE;
}

function parseLimit(value) {
  const n = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, n);
}

const TAILOR_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

function mapCustomerBrief(u) {
  if (!u) return null;
  const name =
    u.fullName || u.username || (u.email ? u.email.split('@')[0] : null) || 'Customer';
  return {
    id: u.id,
    name,
    phone: u.phone || undefined,
    profileImageUrl: u.profileImageUrl || undefined
  };
}

function mapTailorBrief(t) {
  if (!t) return null;
  return {
    id: t.id,
    businessName: t.businessName,
    location: t.location || undefined
  };
}

function mapHomeVisit(v) {
  return {
    id: v.id,
    status: v.status,
    requestedDate: v.requestedDate,
    timeSlot: v.timeSlot,
    address: v.address,
    phone: v.phone,
    purpose: v.purpose || undefined,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    tailor: mapTailorBrief(v.tailor),
    customer: mapCustomerBrief(v.customer)
  };
}

const createHomeVisit = async (req, res) => {
  try {
    const { tailorId, requestedDate, timeSlot, address, phone, purpose } = req.body;

    const tailor = await prisma.tailorProfile.findFirst({
      where: {
        id: tailorId,
        user: { role: 'tailor', status: 'active', deletedAt: null }
      },
      select: { id: true, businessName: true, userId: true }
    });
    if (!tailor) {
      return sendError(res, 'Tailor not found', 404);
    }

    const when = new Date(requestedDate);
    if (Number.isNaN(when.getTime())) {
      return sendError(res, 'requestedDate must be a valid ISO 8601 date', 422);
    }

    const visit = await prisma.homeVisit.create({
      data: {
        customerId: req.user.id,
        tailorId: tailor.id,
        requestedDate: when,
        timeSlot: String(timeSlot).trim(),
        address: String(address).trim(),
        phone: String(phone).trim(),
        purpose: purpose != null && String(purpose).trim() ? String(purpose).trim() : null
      },
      include: {
        tailor: { select: { id: true, businessName: true, location: true } },
        customer: {
          select: { id: true, fullName: true, username: true, email: true, phone: true, profileImageUrl: true }
        }
      }
    });

    await createNotificationAndEmit({
      userId: tailor.userId,
      actorId: req.user.id,
      type: 'booking_requested',
      title: 'Home visit request',
      body: `${mapCustomerBrief(visit.customer).name} requested a home visit on ${when.toISOString().slice(0, 10)} (${visit.timeSlot}).`,
      metadata: { homeVisitId: visit.id, tailorId: tailor.id }
    });

    return sendSuccess(res, 'Home visit requested', { homeVisit: mapHomeVisit(visit) }, 201);
  } catch (err) {
    console.error('createHomeVisit', err);
    return sendError(res, err.message || 'Could not book home visit', 500);
  }
};

const listHomeVisits = async (req, res) => {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    const statusFilter = req.query.status;
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    const status =
      typeof statusFilter === 'string' && allowed.includes(statusFilter) ? statusFilter : undefined;

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
        return sendSuccess(res, 'OK', { homeVisits: [], total: 0, page, totalPages: 0, limit });
      }
      where.tailorId = profile.id;
    } else {
      return sendError(res, 'Forbidden', 403);
    }

    const skip = (page - 1) * limit;
    const [total, rows] = await Promise.all([
      prisma.homeVisit.count({ where }),
      prisma.homeVisit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          tailor: { select: { id: true, businessName: true, location: true } },
          customer: {
            select: { id: true, fullName: true, username: true, email: true, phone: true, profileImageUrl: true }
          }
        }
      })
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return sendSuccess(res, 'OK', {
      homeVisits: rows.map(mapHomeVisit),
      total,
      page,
      limit,
      totalPages
    });
  } catch (err) {
    console.error('listHomeVisits', err);
    return sendError(res, err.message || 'Failed to list home visits', 500);
  }
};

const updateHomeVisitStatus = async (req, res) => {
  const { id } = req.params;
  const { status: nextStatus } = req.body;

  const allowed = ['confirmed', 'completed', 'cancelled'];
  if (!allowed.includes(nextStatus)) {
    return sendError(res, 'Invalid status', 422);
  }

  try {
    const visit = await prisma.homeVisit.findUnique({
      where: { id },
      include: {
        tailor: { select: { id: true, userId: true, businessName: true } },
        customer: { select: { id: true } }
      }
    });

    if (!visit) {
      return sendError(res, 'Home visit not found', 404);
    }

    if (req.user.role === 'customer') {
      if (visit.customerId !== req.user.id) {
        return sendError(res, 'Forbidden', 403);
      }
      if (nextStatus !== 'cancelled' || visit.status !== 'pending') {
        return sendError(res, 'You can only cancel a pending request', 422);
      }
    } else if (req.user.role === 'tailor') {
      if (visit.tailor.userId !== req.user.id) {
        return sendError(res, 'Forbidden', 403);
      }
      const transitions = TAILOR_STATUS_TRANSITIONS[visit.status] || [];
      if (!transitions.includes(nextStatus)) {
        return sendError(res, `Cannot change status from ${visit.status} to ${nextStatus}`, 422);
      }
    } else {
      return sendError(res, 'Forbidden', 403);
    }

    const updated = await prisma.homeVisit.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        tailor: { select: { id: true, businessName: true, location: true } },
        customer: {
          select: { id: true, fullName: true, username: true, email: true, phone: true, profileImageUrl: true }
        }
      }
    });

    if (nextStatus === 'confirmed' && req.user.role === 'tailor') {
      await createNotificationAndEmit({
        userId: visit.customerId,
        actorId: req.user.id,
        type: 'booking_confirmed',
        title: 'Home visit confirmed',
        body: `${visit.tailor.businessName || 'Your tailor'} confirmed your home visit request.`,
        metadata: { homeVisitId: visit.id, tailorId: visit.tailorId }
      });
    }

    return sendSuccess(res, 'Updated', { homeVisit: mapHomeVisit(updated) });
  } catch (err) {
    console.error('updateHomeVisitStatus', err);
    return sendError(res, err.message || 'Could not update home visit', 500);
  }
};

module.exports = {
  createHomeVisit,
  listHomeVisits,
  updateHomeVisitStatus
};
