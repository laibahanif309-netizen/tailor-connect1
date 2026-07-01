const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/response');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function shouldReturnResetTokenInResponse() {
  if (process.env.PASSWORD_RESET_RETURN_TOKEN === 'false') return false;
  if (process.env.PASSWORD_RESET_RETURN_TOKEN === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

const sanitizeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  fullName: user.fullName,
  phone: user.phone ?? null,
  profileImageUrl: user.profileImageUrl ?? null
});

const mapCustomerProfile = (cp) =>
  cp
    ? {
        address: cp.address,
        city: cp.city,
        state: cp.state,
        postalCode: cp.postalCode,
        notes: cp.notes
      }
    : null;

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        customerProfile: true
      }
    });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, 'OK', {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        customerProfile: mapCustomerProfile(user.customerProfile)
      }
    });
  } catch (e) {
    console.error('getMe', e);
    return sendError(res, 'Failed to load profile', 500);
  }
};

const patchMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
      username,
      phone,
      address,
      city,
      state,
      postalCode,
      notes
    } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true }
    });
    if (!existing) {
      return sendError(res, 'User not found', 404);
    }

    const userUpdate = {};
    if (fullName !== undefined) {
      userUpdate.fullName = fullName === null || fullName === '' ? null : String(fullName).trim();
    }
    if (phone !== undefined) {
      userUpdate.phone = phone === null || phone === '' ? null : String(phone).trim();
    }
    if (username !== undefined && username !== null) {
      const u = String(username).trim();
      if (u.length < 3) {
        return sendError(res, 'Username must be at least 3 characters', 422);
      }
      if (u !== existing.username) {
        const taken = await prisma.user.findFirst({
          where: { username: u, NOT: { id: userId } }
        });
        if (taken) {
          return sendError(res, 'Username is already taken', 409);
        }
        userUpdate.username = u;
      }
    }

    const customerUpdate =
      existing.role === 'customer'
        ? {}
        : null;
    if (customerUpdate) {
      if (address !== undefined) customerUpdate.address = address === '' ? null : String(address).trim();
      if (city !== undefined) customerUpdate.city = city === '' ? null : String(city).trim();
      if (state !== undefined) customerUpdate.state = state === '' ? null : String(state).trim();
      if (postalCode !== undefined) customerUpdate.postalCode = postalCode === '' ? null : String(postalCode).trim();
      if (notes !== undefined) customerUpdate.notes = notes === '' ? null : String(notes).trim();
    }

    if (
      Object.keys(userUpdate).length === 0 &&
      (!customerUpdate || Object.keys(customerUpdate).length === 0)
    ) {
      const unchanged = await prisma.user.findUnique({
        where: { id: userId },
        include: { customerProfile: true }
      });
      return sendSuccess(res, 'OK', {
        user: {
          id: unchanged.id,
          username: unchanged.username,
          email: unchanged.email,
          role: unchanged.role,
          fullName: unchanged.fullName,
          phone: unchanged.phone,
          profileImageUrl: unchanged.profileImageUrl,
          customerProfile: mapCustomerProfile(unchanged.customerProfile)
        }
      });
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdate
      });
    }

    if (existing.role === 'customer' && customerUpdate && Object.keys(customerUpdate).length > 0) {
      await prisma.customerProfile.upsert({
        where: { userId },
        create: {
          userId,
          address: customerUpdate.address ?? null,
          city: customerUpdate.city ?? null,
          state: customerUpdate.state ?? null,
          postalCode: customerUpdate.postalCode ?? null,
          notes: customerUpdate.notes ?? null
        },
        update: customerUpdate
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true }
    });

    return sendSuccess(res, 'Profile updated', {
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        fullName: updated.fullName,
        phone: updated.phone,
        profileImageUrl: updated.profileImageUrl,
        customerProfile: mapCustomerProfile(updated.customerProfile)
      }
    });
  } catch (e) {
    console.error('patchMe', e);
    return sendError(res, e.message || 'Failed to update profile', 500);
  }
};

const generateToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }

  if (!process.env.JWT_SECRET) {
    return sendError(res, 'JWT_SECRET is not configured', 500);
  }

  const { username, email, password, role } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return sendError(res, 'Email or username already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
        status: 'active'
      }
    });

    if (role === 'tailor') {
      await prisma.tailorProfile.create({
        data: {
          userId: user.id,
          businessName: `${username}'s Tailoring`,
          location: 'Not set',
          specializations: []
        }
      });
    } else if (role === 'customer') {
      await prisma.customerProfile.create({
        data: {
          userId: user.id
        }
      });
    }

    const token = generateToken(user);

    return sendSuccess(
      res,
      'Registration successful',
      {
        token,
        user: sanitizeUser(user)
      },
      201
    );
  } catch (error) {
    return sendError(res, `Registration failed: ${error.message}`, 500);
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }

  if (!process.env.JWT_SECRET) {
    return sendError(res, 'JWT_SECRET is not configured', 500);
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return sendSuccess(res, 'Login successful', {
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return sendError(res, `Login failed: ${error.message}`, 500);
  }
};

const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }

  const email = String(req.body.email || '').trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    const genericMessage =
      'If an account exists for that email, you can reset your password using the instructions we sent.';

    if (!user) {
      return sendSuccess(res, genericMessage, { requested: true });
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // TODO: send email with reset link in production
    const payload = { requested: true };
    if (shouldReturnResetTokenInResponse()) {
      payload.resetToken = token;
      payload.expiresAt = expiresAt.toISOString();
    }

    return sendSuccess(
      res,
      shouldReturnResetTokenInResponse()
        ? 'Use the reset code below to choose a new password (dev mode).'
        : genericMessage,
      payload
    );
  } catch (error) {
    return sendError(res, `Request failed: ${error.message}`, 500);
  }
};

const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }

  const { token, password } = req.body;

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token: String(token).trim() }
    });

    if (!record || record.usedAt) {
      return sendError(res, 'Invalid or expired reset link. Please request a new one.', 400);
    }

    if (record.expiresAt < new Date()) {
      return sendError(res, 'This reset link has expired. Please request a new one.', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash }
      });
      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() }
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
        data: { usedAt: new Date() }
      });
    });

    return sendSuccess(res, 'Password updated. You can sign in with your new password.', {
      ok: true
    });
  } catch (error) {
    return sendError(res, `Reset failed: ${error.message}`, 500);
  }
};

/** Logged-in user: verify current password, then set a new one (no email link). */
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 422);
  }

  const currentPassword = String(req.body.currentPassword ?? '');
  const newPassword = String(req.body.newPassword ?? '');

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, passwordHash: true }
    });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    if (currentPassword === newPassword) {
      return sendError(
        res,
        'New password must be different from your current password',
        400
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return sendSuccess(res, 'Your password has been updated.', { ok: true });
  } catch (error) {
    console.error('changePassword', error);
    return sendError(res, 'Could not update password', 500);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  patchMe
};
