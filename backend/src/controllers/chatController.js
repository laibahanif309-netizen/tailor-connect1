const { validationResult } = require('express-validator');
const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/response');
const {
  persistMessage,
  markMessagesRead,
  mapMessage,
  assertConversationParticipant
} = require('../services/chatService');
const { getIo } = require('../socket/ioRegistry');

function parsePage(value) {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseLimit(value, max = 100) {
  const n = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return 50;
  return Math.min(max, n);
}

function mapParticipantUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    email: u.email,
    profileImageUrl: u.profileImageUrl,
    role: u.role,
    businessName: u.tailorProfile?.businessName ?? null
  };
}

/**
 * GET /api/conversations
 * Spec: { conversations: [{ id, participant, lastMessage, unreadCount, updatedAt, isOnline }] }
 */
const listConversations = async (req, res) => {
  const userId = req.user.id;
  const presence = req.app.get('presenceIsOnline');
  const isOnline = typeof presence === 'function' ? presence : () => false;

  const list = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } }
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    include: {
      order: { select: { id: true, orderNumber: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
              profileImageUrl: true,
              role: true,
              tailorProfile: { select: { businessName: true } }
            }
          }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          senderId: true,
          type: true,
          content: true,
          imageUrl: true,
          createdAt: true
        }
      }
    }
  });

  const convIds = list.map((c) => c.id);
  const unreadGroups =
    convIds.length > 0
      ? await prisma.message.groupBy({
          by: ['conversationId'],
          where: {
            conversationId: { in: convIds },
            senderId: { not: userId },
            isRead: false
          },
          _count: { _all: true }
        })
      : [];
  const unreadMap = new Map(unreadGroups.map((g) => [g.conversationId, g._count._all]));

  const conversations = [];
  for (const c of list) {
    const others = c.participants.map((x) => x.user).filter((u) => u && u.id !== userId);
    const other = others[0] || null;
    const lastRow = c.messages[0];
    const lastMessage = lastRow
      ? {
          id: lastRow.id,
          content: lastRow.content,
          type: lastRow.type,
          imageUrl: lastRow.imageUrl,
          createdAt: lastRow.createdAt,
          senderId: lastRow.senderId
        }
      : null;

    conversations.push({
      id: c.id,
      participant: mapParticipantUser(other),
      lastMessage,
      unreadCount: unreadMap.get(c.id) ?? 0,
      updatedAt: c.updatedAt,
      lastMessageAt: c.lastMessageAt,
      isOnline: other ? isOnline(other.id) : false,
      order: c.order
    });
  }

  return sendSuccess(res, 'OK', { conversations });
};

/**
 * GET /api/conversations/:conversationId/messages?page=1&limit=50
 */
const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit, 100);

  const ok = await assertConversationParticipant(conversationId, userId);
  if (!ok) return sendError(res, 'Forbidden', 403);

  const where = { conversationId };
  const total = await prisma.message.count({ where });
  // Page 1 = most recent `limit` messages (desc), returned oldest → newest for bubble UIs
  const rows = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          profileImageUrl: true,
          role: true
        }
      }
    }
  });
  const messages = rows.slice().reverse();

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return sendSuccess(res, 'OK', {
    messages: messages.map(mapMessage),
    page,
    limit,
    total,
    totalPages
  });
};

/**
 * PATCH /api/conversations/:conversationId/read
 */
const markConversationRead = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const count = await markMessagesRead(conversationId, req.user.id);
    const io = getIo();
    if (io) {
      io.to(`conv:${conversationId}`).emit('message_read', {
        conversationId,
        readBy: req.user.id,
        count
      });
    }
    return sendSuccess(res, 'OK', { marked: count });
  } catch (e) {
    if (e.code === 'FORBIDDEN') return sendError(res, 'Forbidden', 403);
    console.error('markConversationRead', e);
    return sendError(res, 'Could not update read state', 500);
  }
};

/**
 * POST /api/messages (REST fallback)
 * body: { conversationId, content?, messageType: 'text'|'image', imageUrl? }
 */
const createMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }

  const { conversationId, content, messageType, imageUrl } = req.body;
  const type = messageType === 'image' ? 'image' : 'text';

  if (type === 'text' && (!content || !String(content).trim())) {
    return sendError(res, 'content is required for text messages', 422);
  }
  if (type === 'image' && (!imageUrl || !String(imageUrl).trim())) {
    return sendError(res, 'imageUrl is required for image messages', 422);
  }

  try {
    const message = await persistMessage({
      conversationId,
      senderId: req.user.id,
      type,
      content: type === 'text' ? content : undefined,
      imageUrl: type === 'image' ? imageUrl : undefined
    });

    const payload = { conversationId, message: mapMessage(message) };
    const io = getIo();
    if (io) {
      io.to(`conv:${conversationId}`).emit('message_received', payload);
      io.to(`conv:${conversationId}`).emit('new_message', payload);
      io.emit('conversation_updated', { conversationId });
    }

    return sendSuccess(res, 'Message sent', mapMessage(message), 201);
  } catch (e) {
    if (e.code === 'NOT_FOUND') return sendError(res, 'Conversation not found', 404);
    if (e.code === 'FORBIDDEN') return sendError(res, 'Forbidden', 403);
    if (e.code === 'VALIDATION') return sendError(res, e.message, 422);
    console.error('createMessage', e);
    return sendError(res, 'Could not send message', 500);
  }
};

/**
 * POST /api/conversations/from-order — ensure thread for an order (customer or tailor on that order)
 */
const createConversationFromOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }

  const { orderId } = req.body;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      tailor: { select: { userId: true } },
      customer: { select: { id: true } }
    }
  });

  if (!order) return sendError(res, 'Order not found', 404);

  const tailorUserId = order.tailor.userId;
  const customerUserId = order.customerId;
  if (req.user.id !== customerUserId && req.user.id !== tailorUserId) {
    return sendError(res, 'Forbidden', 403);
  }

  let conv = await prisma.conversation.findFirst({
    where: { orderId: order.id }
  });

  if (!conv) {
    conv = await prisma.$transaction(async (tx) => {
      const c = await tx.conversation.create({
        data: { orderId: order.id }
      });
      await tx.conversationParticipant.createMany({
        data: [
          { conversationId: c.id, userId: customerUserId },
          { conversationId: c.id, userId: tailorUserId }
        ],
        skipDuplicates: true
      });
      return c;
    });
  }

  return sendSuccess(res, 'OK', { conversation: { id: conv.id, orderId: order.id } }, 201);
};

/**
 * POST /api/messages/upload-image — multer sets req.file
 */
const uploadChatImage = (req, res) => {
  if (!req.file?.filename) {
    return sendError(res, 'No image uploaded', 400);
  }
  const imageUrl = `/uploads/chat/${req.file.filename}`;
  return sendSuccess(res, 'OK', { imageUrl });
};

module.exports = {
  listConversations,
  getMessages,
  markConversationRead,
  createMessage,
  createConversationFromOrder,
  uploadChatImage
};
