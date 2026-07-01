const { Prisma } = require('@prisma/client');
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

function authorDisplayName(author) {
  if (!author) return 'Customer';
  return (
    author.fullName ||
    author.username ||
    (author.email ? author.email.split('@')[0] : null) ||
    'Customer'
  );
}

function mapReviewForClient(r) {
  return {
    id: r.id,
    customerId: r.authorId,
    customerName: authorDisplayName(r.author),
    customerAvatar: r.author?.profileImageUrl || undefined,
    tailorId: r.tailorId,
    orderId: r.orderId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt
  };
}

async function recalculateTailorReviewStats(tailorId) {
  const agg = await prisma.review.aggregate({
    where: { tailorId, isVisible: true },
    _avg: { rating: true },
    _count: { _all: true }
  });
  const total = agg._count._all ?? 0;
  const avgNum = total === 0 ? 0 : Number(agg._avg.rating ?? 0);
  await prisma.tailorProfile.update({
    where: { id: tailorId },
    data: {
      totalReviews: total,
      averageRating: new Prisma.Decimal(avgNum.toFixed(2))
    }
  });
}

const listReviewsForTailor = async (req, res) => {
  const tailorId = req.query.tailorId;
  if (!tailorId || typeof tailorId !== 'string') {
    return sendError(res, 'tailorId query parameter is required', 400);
  }

  try {
    const tailor = await prisma.tailorProfile.findFirst({
      where: {
        id: tailorId,
        user: { role: 'tailor', status: 'active', deletedAt: null }
      },
      select: { id: true }
    });
    if (!tailor) {
      return sendError(res, 'Tailor not found', 404);
    }

    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    const skip = (page - 1) * limit;

    const where = { tailorId, isVisible: true };

    const [total, rows] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              fullName: true,
              username: true,
              profileImageUrl: true
            }
          }
        }
      })
    ]);

    const reviews = rows.map(mapReviewForClient);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return sendSuccess(res, 'OK', {
      reviews,
      total,
      page,
      limit,
      totalPages
    });
  } catch (err) {
    console.error('listReviewsForTailor', err);
    return sendError(res, err.message || 'Failed to load reviews', 500);
  }
};

const createReview = async (req, res) => {
  const { orderId, rating, comment } = req.body;

  const r = typeof rating === 'string' ? parseInt(rating, 10) : Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return sendError(res, 'rating must be an integer from 1 to 5', 422);
  }

  const c = typeof comment === 'string' ? comment.trim() : '';
  if (c.length < 3) {
    return sendError(res, 'comment must be at least 3 characters', 422);
  }
  if (c.length > 2000) {
    return sendError(res, 'comment must be at most 2000 characters', 422);
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId: req.user.id },
      include: { review: true }
    });

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    if (order.status !== 'completed') {
      return sendError(res, 'You can only review completed orders', 422);
    }
    if (order.review) {
      return sendError(res, 'This order already has a review', 409);
    }

    const created = await prisma.review.create({
      data: {
        orderId: order.id,
        authorId: req.user.id,
        tailorId: order.tailorId,
        rating: r,
        comment: c
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
            profileImageUrl: true
          }
        }
      }
    });

    await recalculateTailorReviewStats(order.tailorId);

    try {
      const tp = await prisma.tailorProfile.findUnique({
        where: { id: order.tailorId },
        select: { userId: true, businessName: true }
      });
      if (tp) {
        await createNotificationAndEmit({
          userId: tp.userId,
          actorId: req.user.id,
          type: 'review_received',
          title: 'New review',
          body: `You received a ${r}-star review${tp.businessName ? ` for ${tp.businessName}` : ''}.`,
          metadata: { reviewId: created.id, orderId: order.id, tailorId: order.tailorId }
        });
      }
    } catch (e) {
      console.error('review notification', e);
    }

    return sendSuccess(res, 'Review submitted', { review: mapReviewForClient(created) }, 201);
  } catch (err) {
    if (err.code === 'P2002') {
      return sendError(res, 'This order already has a review', 409);
    }
    console.error('createReview', err);
    return sendError(res, err.message || 'Could not submit review', 500);
  }
};

module.exports = {
  listReviewsForTailor,
  createReview
};
