import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import crypto from 'crypto';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken
} from '../services/authService.js';

const sendTokenResponse = (res, user, accessToken, refreshToken) => {
  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE === 'true',
    sameSite: env.COOKIE_SAMESITE || 'lax',
    path: '/api/v1/auth',
    maxAge: parseInt(env.REFRESH_TOKEN_TTL_DAYS || '7') * 24 * 60 * 60 * 1000
  });

  res.status(200).json({
    success: true,
    data: {
      user,
      accessToken
    }
  });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email: email.toLowerCase().trim() });
  if (userExists) {
    throw new ApiError(409, 'User already exists', 'CONFLICT');
  }

  const passwordHash = await hashPassword(password);
  
  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'operator' // Hardcode to lowest privilege, ignores body.role
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id, req.ip, req.headers['user-agent']);

  sendTokenResponse(res, user, accessToken, refreshToken);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password', 'UNAUTHENTICATED');
  }

  if (user.status !== 'active') {
    throw new ApiError(401, 'Account disabled', 'UNAUTHENTICATED');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id, req.ip, req.headers['user-agent']);

  sendTokenResponse(res, user, accessToken, refreshToken);
});

export const refresh = asyncHandler(async (req, res) => {
  const oldToken = req.cookies.jwt;
  if (!oldToken) {
    throw new ApiError(401, 'No refresh token provided', 'UNAUTHENTICATED');
  }

  const oldHash = crypto.createHash('sha256').update(oldToken).digest('hex');
  const tokenRecord = await RefreshToken.findOne({ tokenHash: oldHash }).populate('userId');

  if (!tokenRecord) {
    throw new ApiError(401, 'Invalid refresh token', 'UNAUTHENTICATED');
  }

  const newRefreshToken = await rotateRefreshToken(oldToken, tokenRecord.userId._id, req.ip, req.headers['user-agent']);
  const accessToken = generateAccessToken(tokenRecord.userId);

  sendTokenResponse(res, tokenRecord.userId, accessToken, newRefreshToken);
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.jwt;
  if (token) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await RefreshToken.findOneAndUpdate({ tokenHash: hash }, { revokedAt: new Date() });
  }

  res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/api/v1/auth'
  });

  res.status(200).json({ success: true, data: {} });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});
