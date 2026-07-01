const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/response');

const FABRIC_PLACEHOLDER =
  'https://placehold.co/400x400/F3F4F6/6B7280?text=Fabric';

async function getTailorProfileForUser(userId) {
  return prisma.tailorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          profileImageUrl: true,
          fullName: true,
          username: true,
        },
      },
      portfolioItems: {
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
      fabrics: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              fullName: true,
              username: true,
              profileImageUrl: true,
            },
          },
        },
      },
    },
  });
}

function mapFabric(f) {
  return {
    id: f.id,
    name: f.name,
    imageUrl: f.imageUrl || FABRIC_PLACEHOLDER,
    price: Math.round(f.priceCents / 100),
    description: f.description || undefined,
    tailorId: f.tailorId,
    isActive: f.isActive,
  };
}

function mapTailorResponse(profile) {
  const portfolio = profile.portfolioItems.map((p) => ({
    id: p.id,
    imageUrl: p.imageUrl,
    description: p.description || undefined,
    createdAt: p.createdAt,
    tailorId: p.tailorId,
  }));

  const fabrics = profile.fabrics.map(mapFabric);

  const reviews = profile.reviews.map((r) => ({
    id: r.id,
    customerId: r.authorId,
    customerName:
      r.author.fullName ||
      r.author.username ||
      (r.author.email ? r.author.email.split('@')[0] : null) ||
      'Customer',
    customerAvatar: r.author.profileImageUrl || undefined,
    tailorId: r.tailorId,
    orderId: r.orderId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  }));

  return {
    id: profile.id,
    userId: profile.userId,
    businessName: profile.businessName,
    location: profile.location,
    phone: profile.user.phone || undefined,
    email: profile.user.email,
    description: profile.description || undefined,
    specializations: profile.specializations,
    experience: profile.yearsOfExperience,
    rating: Number(profile.averageRating),
    totalReviews: profile.totalReviews,
    isAvailable: profile.isAvailable,
    profileImage: profile.user.profileImageUrl || undefined,
    portfolio,
    fabrics,
    reviews,
  };
}

/**
 * GET /api/tailors/me — own profile (same shape as GET /api/tailors/:id)
 */
const getMe = async (req, res) => {
  try {
    const profile = await getTailorProfileForUser(req.user.id);
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }
    return sendSuccess(res, 'OK', { tailor: mapTailorResponse(profile) });
  } catch (e) {
    console.error('getMe tailor', e);
    return sendError(res, e.message || 'Failed to load profile', 500);
  }
};

/**
 * PATCH /api/tailors/me — partial update (JSON)
 */
const patchMe = async (req, res) => {
  try {
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }

    const b = req.body || {};
    const userData = {};
    if (typeof b.phone === 'string') {
      userData.phone = b.phone.trim() || null;
    }

    const profileData = {};
    if (typeof b.businessName === 'string' && b.businessName.trim().length >= 2) {
      profileData.businessName = b.businessName.trim();
    }
    if (typeof b.location === 'string' && b.location.trim().length >= 1) {
      profileData.location = b.location.trim();
    }
    if (typeof b.description === 'string') {
      profileData.description = b.description.trim() || null;
    }
    if (b.yearsOfExperience != null && b.yearsOfExperience !== '') {
      const y = parseInt(String(b.yearsOfExperience), 10);
      if (Number.isFinite(y) && y >= 0 && y <= 80) {
        profileData.yearsOfExperience = y;
      }
    }
    if (Array.isArray(b.specializations) && b.specializations.length > 0) {
      profileData.specializations = b.specializations.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof b.isAvailable === 'boolean') {
      profileData.isAvailable = b.isAvailable;
    }

    const hasUser = Object.keys(userData).length > 0;
    const hasProfile = Object.keys(profileData).length > 0;
    if (hasUser || hasProfile) {
      await prisma.$transaction(async (tx) => {
        if (hasUser) {
          await tx.user.update({
            where: { id: req.user.id },
            data: userData,
          });
        }
        if (hasProfile) {
          await tx.tailorProfile.update({
            where: { id: profile.id },
            data: profileData,
          });
        }
      });
    }

    const fresh = await getTailorProfileForUser(req.user.id);
    return sendSuccess(res, 'Profile updated', { tailor: mapTailorResponse(fresh) });
  } catch (e) {
    console.error('patchMe tailor', e);
    return sendError(res, e.message || 'Update failed', 500);
  }
};

/**
 * POST /api/tailors/me/profile-image — multipart field `image`
 */
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file?.filename) {
      return sendError(res, 'No image uploaded', 400);
    }
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { profileImageUrl: imageUrl },
    });
    return sendSuccess(res, 'OK', { profileImageUrl: imageUrl });
  } catch (e) {
    console.error('uploadProfileImage', e);
    return sendError(res, e.message || 'Upload failed', 500);
  }
};

/**
 * POST /api/tailors/me/portfolio — multipart `image`, optional `description`
 */
const addPortfolio = async (req, res) => {
  try {
    if (!req.file?.filename) {
      return sendError(res, 'Image is required', 400);
    }
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }
    const imageUrl = `/uploads/portfolio/${req.file.filename}`;
    const description =
      typeof req.body.description === 'string' && req.body.description.trim()
        ? req.body.description.trim().slice(0, 500)
        : null;
    const item = await prisma.portfolioItem.create({
      data: {
        tailorId: profile.id,
        imageUrl,
        description,
      },
    });
    return sendSuccess(
      res,
      'Portfolio item added',
      {
        item: {
          id: item.id,
          imageUrl: item.imageUrl,
          description: item.description || undefined,
          createdAt: item.createdAt,
          tailorId: item.tailorId,
        },
      },
      201
    );
  } catch (e) {
    console.error('addPortfolio', e);
    return sendError(res, e.message || 'Failed to add portfolio item', 500);
  }
};

/**
 * DELETE /api/tailors/me/portfolio/:itemId
 */
const deletePortfolioItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!itemId) {
      return sendError(res, 'itemId is required', 400);
    }
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }
    const deleted = await prisma.portfolioItem.deleteMany({
      where: { id: itemId, tailorId: profile.id },
    });
    if (deleted.count === 0) {
      return sendError(res, 'Portfolio item not found', 404);
    }
    return sendSuccess(res, 'Deleted', { id: itemId });
  } catch (e) {
    console.error('deletePortfolioItem', e);
    return sendError(res, e.message || 'Failed to delete', 500);
  }
};

/**
 * GET /api/tailors/me/fabrics — all fabrics (including inactive) for management
 */
const listFabrics = async (req, res) => {
  try {
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }
    const rows = await prisma.fabric.findMany({
      where: { tailorId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 'OK', {
      fabrics: rows.map(mapFabric),
    });
  } catch (e) {
    console.error('listFabrics', e);
    return sendError(res, e.message || 'Failed to list fabrics', 500);
  }
};

/**
 * POST /api/tailors/me/fabrics — multipart: name, price (PKR major), description optional, image optional
 */
const createFabric = async (req, res) => {
  try {
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }
    const name = (req.body.name || '').trim();
    if (name.length < 1) {
      return sendError(res, 'Fabric name is required', 422);
    }
    const priceRaw = req.body.price;
    const priceNum = parseFloat(String(priceRaw ?? ''));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return sendError(res, 'Valid price is required', 422);
    }
    const priceCents = Math.round(priceNum * 100);
    const description =
      typeof req.body.description === 'string' && req.body.description.trim()
        ? req.body.description.trim().slice(0, 1000)
        : null;
    let imageUrl = null;
    if (req.file?.filename) {
      imageUrl = `/uploads/fabrics/${req.file.filename}`;
    }
    const fabric = await prisma.fabric.create({
      data: {
        tailorId: profile.id,
        name,
        priceCents,
        description,
        imageUrl,
        isActive: true,
      },
    });
    return sendSuccess(res, 'Fabric created', { fabric: mapFabric(fabric) }, 201);
  } catch (e) {
    console.error('createFabric', e);
    return sendError(res, e.message || 'Failed to create fabric', 500);
  }
};

/**
 * PATCH /api/tailors/me/fabrics/:fabricId — JSON partial update
 */
const patchFabric = async (req, res) => {
  try {
    const { fabricId } = req.params;
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }
    const existing = await prisma.fabric.findFirst({
      where: { id: fabricId, tailorId: profile.id },
    });
    if (!existing) {
      return sendError(res, 'Fabric not found', 404);
    }
    const b = req.body || {};
    const data = {};
    if (typeof b.name === 'string' && b.name.trim().length >= 1) {
      data.name = b.name.trim();
    }
    if (b.price != null && b.price !== '') {
      const priceNum = parseFloat(String(b.price));
      if (Number.isFinite(priceNum) && priceNum >= 0) {
        data.priceCents = Math.round(priceNum * 100);
      }
    }
    if (typeof b.description === 'string') {
      data.description = b.description.trim() || null;
    }
    if (typeof b.isActive === 'boolean') {
      data.isActive = b.isActive;
    }
    if (Object.keys(data).length === 0) {
      return sendSuccess(res, 'OK', { fabric: mapFabric(existing) });
    }
    const fabric = await prisma.fabric.update({
      where: { id: fabricId },
      data,
    });
    return sendSuccess(res, 'Fabric updated', { fabric: mapFabric(fabric) });
  } catch (e) {
    console.error('patchFabric', e);
    return sendError(res, e.message || 'Failed to update fabric', 500);
  }
};

/**
 * POST /api/tailors/me/fabrics/:fabricId/image — multipart: image (required)
 */
const uploadFabricPhoto = async (req, res) => {
  try {
    const { fabricId } = req.params;
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }
    const existing = await prisma.fabric.findFirst({
      where: { id: fabricId, tailorId: profile.id },
    });
    if (!existing) {
      return sendError(res, 'Fabric not found', 404);
    }
    if (!req.file?.filename) {
      return sendError(res, 'Image file is required', 422);
    }
    const imageUrl = `/uploads/fabrics/${req.file.filename}`;
    const fabric = await prisma.fabric.update({
      where: { id: fabricId },
      data: { imageUrl },
    });
    return sendSuccess(res, 'Photo updated', { fabric: mapFabric(fabric) });
  } catch (e) {
    console.error('uploadFabricPhoto', e);
    return sendError(res, e.message || 'Failed to update fabric photo', 500);
  }
};

/**
 * DELETE /api/tailors/me/fabrics/:fabricId — soft-delete (isActive false)
 */
const deleteFabric = async (req, res) => {
  try {
    const { fabricId } = req.params;
    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }
    const existing = await prisma.fabric.findFirst({
      where: { id: fabricId, tailorId: profile.id },
    });
    if (!existing) {
      return sendError(res, 'Fabric not found', 404);
    }
    await prisma.fabric.update({
      where: { id: fabricId },
      data: { isActive: false },
    });
    return sendSuccess(res, 'Fabric removed', { id: fabricId });
  } catch (e) {
    console.error('deleteFabric', e);
    return sendError(res, e.message || 'Failed to delete fabric', 500);
  }
};

module.exports = {
  getMe,
  patchMe,
  uploadProfileImage,
  addPortfolio,
  deletePortfolioItem,
  listFabrics,
  createFabric,
  patchFabric,
  uploadFabricPhoto,
  deleteFabric,
};
