const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/response');
const { mapNotification } = require('../services/notificationService');

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

const listNotifications = async (req, res) => {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true' || req.query.unreadOnly === '1';

    const where = { userId: req.user.id };
    if (unreadOnly) where.isRead = false;

    const skip = (page - 1) * limit;
    const [total, rows, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
              profileImageUrl: true
            }
          }
        }
      }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return sendSuccess(res, 'OK', {
      notifications: rows.map(mapNotification),
      total,
      page,
      limit,
      totalPages,
      unreadCount
    });
  } catch (err) {
    console.error('listNotifications', err);
    return sendError(res, err.message || 'Failed to load notifications', 500);
  }
};

const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  try {
    const row = await prisma.notification.findFirst({
      where: { id, userId: req.user.id }
    });
    if (!row) {
      return sendError(res, 'Notification not found', 404);
    }
    if (row.isRead) {
      const full = await prisma.notification.findUnique({
        where: { id },
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
              profileImageUrl: true
            }
          }
        }
      });
      return sendSuccess(res, 'OK', { notification: mapNotification(full) });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profileImageUrl: true
          }
        }
      }
    });

    return sendSuccess(res, 'Marked read', { notification: mapNotification(updated) });
  } catch (err) {
    console.error('markNotificationRead', err);
    return sendError(res, err.message || 'Could not update notification', 500);
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
    return sendSuccess(res, 'OK', { updated: result.count });
  } catch (err) {
    console.error('markAllNotificationsRead', err);
    return sendError(res, err.message || 'Could not mark all read', 500);
  }
};

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
