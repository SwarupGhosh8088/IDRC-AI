import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, parseInt(env.BCRYPT_ROUNDS || '12'));
};

export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, status: user.status },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    }
  );
};

export const generateRefreshToken = async (userId, ip, userAgent) => {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(env.REFRESH_TOKEN_TTL_DAYS || '7'));

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    ip,
    userAgent
  });

  return token;
};

export const rotateRefreshToken = async (oldToken, userId, ip, userAgent) => {
  const oldHash = crypto.createHash('sha256').update(oldToken).digest('hex');
  const existingToken = await RefreshToken.findOne({ tokenHash: oldHash });

  if (!existingToken) {
    throw new ApiError(401, 'Invalid refresh token', 'UNAUTHENTICATED');
  }

  if (existingToken.revokedAt) {
    // Reuse detection
    await RefreshToken.updateMany({ userId }, { $set: { revokedAt: new Date() } });
    throw new ApiError(401, 'Token reuse detected', 'UNAUTHENTICATED');
  }

  existingToken.revokedAt = new Date();
  await existingToken.save();

  return await generateRefreshToken(userId, ip, userAgent);
};
