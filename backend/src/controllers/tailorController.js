const { Prisma } = require('@prisma/client');
const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/response');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseIntParam(value, fallback) {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseFloatParam(value, fallback) {
  const n = parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function parseBoolParam(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const s = String(value).toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return undefined;
}

function parseSpecializations(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(',') : String(value);
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Shared list logic for GET /api/tailors and GET /api/search/tailors
 */
async function listTailorsInternal(query) {
  const page = Math.max(1, parseIntParam(query.page, 1));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseIntParam(query.limit, DEFAULT_LIMIT)));
  const searchText = (query.query || query.search || '').trim();
  const location = (query.location || '').trim();
  const minRating = parseFloatParam(query.minRating ?? query.rating, 0);
  const specializations = parseSpecializations(query.specializations);
  const available = parseBoolParam(query.availability ?? query.available);

  const where = {
    user: {
      role: 'tailor',
      status: 'active',
      deletedAt: null
    }
  };

  const and = [];

  if (searchText) {
    and.push({
      OR: [
        { businessName: { contains: searchText, mode: 'insensitive' } },
        { location: { contains: searchText, mode: 'insensitive' } },
        { description: { contains: searchText, mode: 'insensitive' } }
      ]
    });
  }

  if (location) {
    and.push({
      location: { contains: location, mode: 'insensitive' }
    });
  }

  if (minRating > 0) {
    and.push({
      averageRating: { gte: new Prisma.Decimal(minRating.toFixed(2)) }
    });
  }

  if (specializations.length > 0) {
    and.push({
      specializations: { hasSome: specializations }
    });
  }

  if (available === true) {
    and.push({ isAvailable: true });
  }

  if (and.length) {
    where.AND = and;
  }

  const skip = (page - 1) * limit;

  const [total, rows] = await Promise.all([
    prisma.tailorProfile.count({ where }),
    prisma.tailorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ averageRating: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            profileImageUrl: true
          }
        }
      }
    })
  ]);

  const tailors = rows.map((t) => ({
    id: t.id,
    businessName: t.businessName,
    location: t.location,
    rating: Number(t.averageRating),
    profileImage: t.user.profileImageUrl || undefined,
    specializations: t.specializations,
    isAvailable: t.isAvailable,
    totalReviews: t.totalReviews,
    userId: t.userId
  }));

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { tailors, total, page, totalPages };
}

const listTailors = async (req, res) => {
  try {
    const data = await listTailorsInternal(req.query);
    return sendSuccess(res, 'OK', data);
  } catch (error) {
    return sendError(res, error.message || 'Failed to list tailors', 500);
  }
};

const searchTailors = async (req, res) => {
  try {
    const data = await listTailorsInternal(req.query);
    return sendSuccess(res, 'OK', data);
  } catch (error) {
    return sendError(res, error.message || 'Search failed', 500);
  }
};

const FABRIC_PLACEHOLDER =
  'https://placehold.co/400x400/F3F4F6/6B7280?text=Fabric';

const mapFabric = (f) => ({
  id: f.id,
  name: f.name,
  imageUrl: f.imageUrl || FABRIC_PLACEHOLDER,
  price: Math.round(f.priceCents / 100),
  description: f.description || undefined,
  tailorId: f.tailorId
});

const getTailorById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return sendError(res, 'Tailor id is required', 400);
  }

  try {
    const profile = await prisma.tailorProfile.findFirst({
      where: {
        id,
        user: { role: 'tailor', status: 'active', deletedAt: null }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profileImageUrl: true,
            fullName: true,
            username: true
          }
        },
        portfolioItems: {
          where: {},
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        fabrics: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
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
                profileImageUrl: true
              }
            }
          }
        }
      }
    });

    if (!profile) {
      return sendError(res, 'Tailor not found', 404);
    }

    const portfolio = profile.portfolioItems.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      description: p.description || undefined,
      createdAt: p.createdAt,
      tailorId: p.tailorId
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
      createdAt: r.createdAt
    }));

    const tailor = {
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
      reviews
    };

    return sendSuccess(res, 'OK', { tailor });
  } catch (error) {
    return sendError(res, error.message || 'Failed to load tailor', 500);
  }
};

const getPortfolioByTailorId = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return sendError(res, 'Tailor id is required', 400);
  }

  try {
    const exists = await prisma.tailorProfile.findFirst({
      where: {
        id,
        user: { role: 'tailor', status: 'active', deletedAt: null }
      },
      select: { id: true }
    });

    if (!exists) {
      return sendError(res, 'Tailor not found', 404);
    }

    const items = await prisma.portfolioItem.findMany({
      where: { tailorId: id },
      orderBy: { createdAt: 'desc' }
    });

    const portfolio = items.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      description: p.description || undefined,
      createdAt: p.createdAt,
      tailorId: p.tailorId
    }));

    return sendSuccess(res, 'OK', { portfolio, total: portfolio.length });
  } catch (error) {
    return sendError(res, error.message || 'Failed to load portfolio', 500);
  }
};

module.exports = {
  listTailors,
  searchTailors,
  getTailorById,
  getPortfolioByTailorId
};
