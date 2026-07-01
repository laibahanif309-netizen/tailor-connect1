const { prisma } = require('../config/prisma');

async function assertConversationParticipant(conversationId, userId) {
  const row = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    }
  });
  return Boolean(row);
}

/**
 * @param {object} params
 * @param {string} params.conversationId
 * @param {string} params.senderId
 * @param {'text'|'image'} params.type
 * @param {string} [params.content]
 * @param {string} [params.imageUrl]
 */
async function persistMessage({ conversationId, senderId, type, content, imageUrl }) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, orderId: true }
  });
  if (!conv) {
    const err = new Error('Conversation not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const ok = await assertConversationParticipant(conversationId, senderId);
  if (!ok) {
    const err = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    throw err;
  }

  if (type === 'text' && (!content || !String(content).trim())) {
    const err = new Error('Message content is required');
    err.code = 'VALIDATION';
    throw err;
  }
  if (type === 'image' && !imageUrl) {
    const err = new Error('imageUrl is required for image messages');
    err.code = 'VALIDATION';
    throw err;
  }

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId,
        orderId: conv.orderId,
        type,
        content: type === 'text' ? String(content).trim() : null,
        imageUrl: type === 'image' ? imageUrl : null
      },
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

    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: msg.createdAt,
        lastMessageId: msg.id
      }
    });

    return msg;
  });

  return message;
}

async function markMessagesRead(conversationId, readerUserId) {
  const ok = await assertConversationParticipant(conversationId, readerUserId);
  if (!ok) {
    const err = new Error('Forbidden');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const now = new Date();
  const updated = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: readerUserId },
      isRead: false
    },
    data: { isRead: true, readAt: now }
  });

  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: readerUserId
      }
    },
    data: { lastReadAt: now }
  });

  return updated.count;
}

function mapMessage(m) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    orderId: m.orderId,
    type: m.type,
    content: m.content,
    imageUrl: m.imageUrl,
    isRead: m.isRead,
    readAt: m.readAt,
    createdAt: m.createdAt,
    sender: m.sender
      ? {
          id: m.sender.id,
          fullName: m.sender.fullName,
          username: m.sender.username,
          email: m.sender.email,
          profileImageUrl: m.sender.profileImageUrl,
          role: m.sender.role
        }
      : undefined
  };
}

module.exports = {
  assertConversationParticipant,
  persistMessage,
  markMessagesRead,
  mapMessage
};
