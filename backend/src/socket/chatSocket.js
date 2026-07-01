const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');
const { persistMessage, mapMessage, markMessagesRead } = require('../services/chatService');

/**
 * Socket.io — Phase 5 chat (spec names).
 *
 * Client auth: socket.io(..., { auth: { token: '<JWT>' } })
 *
 * Events (client → server):
 * - send_message: { conversationId, content?, messageType: 'text'|'image', imageUrl? }
 * - typing: { conversationId }
 * - stop_typing: { conversationId }
 * - mark_read: { conversationId }
 *
 * Events (server → client):
 * - message_received, new_message: { conversationId, message }
 * - conversation_updated: { conversationId }
 * - typing: { conversationId, userId }
 * - stop_typing: { conversationId, userId }
 * - message_read: { conversationId, readBy, count? }
 * - new_notification: { notification } — persisted row for the recipient (same room as `user:${userId}`).
 */

function registerChatSockets(io, app) {
  const userIdToSockets = new Map();

  function addSocket(userId, socketId) {
    if (!userIdToSockets.has(userId)) userIdToSockets.set(userId, new Set());
    userIdToSockets.get(userId).add(socketId);
  }

  function removeSocket(userId, socketId) {
    const set = userIdToSockets.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) userIdToSockets.delete(userId);
  }

  app.set('presenceIsOnline', (userId) => (userIdToSockets.get(userId)?.size ?? 0) > 0);

  io.use((socket, next) => {
    try {
      const raw =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (typeof socket.handshake.headers?.authorization === 'string'
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : null);
      if (!raw || !process.env.JWT_SECRET) {
        return next(new Error('Unauthorized'));
      }
      const payload = jwt.verify(String(raw), process.env.JWT_SECRET);
      socket.userId = payload.sub;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    addSocket(userId, socket.id);

    try {
      const parts = await prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true }
      });
      for (const p of parts) {
        socket.join(`conv:${p.conversationId}`);
      }
      socket.join(`user:${userId}`);
    } catch (e) {
      console.error('socket join conversations', e);
    }

    socket.on('send_message', async (payload, ack) => {
      try {
        const { conversationId, content, messageType, imageUrl } = payload || {};
        if (!conversationId) {
          throw new Error('conversationId is required');
        }
        const type = messageType === 'image' ? 'image' : 'text';
        const message = await persistMessage({
          conversationId,
          senderId: userId,
          type,
          content: type === 'text' ? content : undefined,
          imageUrl: type === 'image' ? imageUrl : undefined
        });
        const mapped = mapMessage(message);
        const out = { conversationId, message: mapped };
        io.to(`conv:${conversationId}`).emit('message_received', out);
        io.to(`conv:${conversationId}`).emit('new_message', out);
        io.emit('conversation_updated', { conversationId });
        if (typeof ack === 'function') ack({ ok: true, message: mapped });
      } catch (e) {
        console.error('send_message', e);
        if (typeof ack === 'function') ack({ ok: false, error: e.message || 'Failed' });
      }
    });

    socket.on('typing', (payload) => {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;
      socket.to(`conv:${conversationId}`).emit('typing', { conversationId, userId });
    });

    socket.on('stop_typing', (payload) => {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;
      socket.to(`conv:${conversationId}`).emit('stop_typing', { conversationId, userId });
    });

    socket.on('mark_read', async (payload, ack) => {
      try {
        const conversationId = payload?.conversationId;
        if (!conversationId) throw new Error('conversationId is required');
        const count = await markMessagesRead(conversationId, userId);
        io.to(`conv:${conversationId}`).emit('message_read', {
          conversationId,
          readBy: userId,
          count
        });
        if (typeof ack === 'function') ack({ ok: true, count });
      } catch (e) {
        if (typeof ack === 'function') ack({ ok: false, error: e.message });
      }
    });

    socket.on('disconnect', () => {
      removeSocket(userId, socket.id);
    });
  });
}

module.exports = { registerChatSockets };
