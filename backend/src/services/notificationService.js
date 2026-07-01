const { prisma } = require('../config/prisma');
const { getIo } = require('../socket/ioRegistry');

function actorDisplayName(actor) {
  if (!actor) return undefined;
  return (
    actor.fullName ||
    actor.username ||
    (actor.email ? actor.email.split('@')[0] : null) ||
    'User'
  );
}

function mapNotification(row) {
  const n = row;
  return {
    id: n.id,
    userId: n.userId,
    actorId: n.actorId || undefined,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    readAt: n.readAt || undefined,
    metadata: n.metadata ?? undefined,
    createdAt: n.createdAt,
    actor: n.actor
      ? {
          id: n.actor.id,
          name: actorDisplayName(n.actor),
          profileImageUrl: n.actor.profileImageUrl || undefined
        }
      : undefined
  };
}

/**
 * Persist notification and push to user's socket room (`user:${userId}`).
 */
async function createNotificationAndEmit({ userId, actorId, type, title, body, metadata }) {
  const row = await prisma.notification.create({
    data: {
      userId,
      actorId: actorId || null,
      type,
      title,
      body,
      metadata: metadata === undefined || metadata === null ? undefined : metadata
    },
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

  const payload = { notification: mapNotification(row) };
  const io = getIo();
  if (io) {
    io.to(`user:${userId}`).emit('new_notification', payload);
  }

  return row;
}

module.exports = {
  mapNotification,
  createNotificationAndEmit
};
