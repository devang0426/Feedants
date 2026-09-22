import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/index.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function extractBearer(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/**
 * Populates `req.user` when a valid token is present, otherwise leaves it
 * undefined. Used by read endpoints that render differently for guests.
 */
export async function optionalAuth(req, _res, next) {
  try {
    const token = extractBearer(req);
    if (!token) return next();
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = await User.findById(payload.sub).lean();
    return next();
  } catch {
    return next(); // invalid/expired token behaves like a guest on read endpoints
  }
}

/** Rejects the request unless a valid token identifies an existing user. */
export async function requireAuth(req, _res, next) {
  try {
    const token = extractBearer(req);
    if (!token) throw AppError.unauthorized();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user) throw AppError.unauthorized('User no longer exists');
    req.user = user;
    return next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(AppError.unauthorized('Invalid or expired token'));
  }
}

/** Simple shared-secret guard for operational/admin endpoints. */
export function requireAdminKey(req, _res, next) {
  if (req.headers['x-admin-key'] !== env.adminApiKey) {
    return next(AppError.forbidden('Admin key required'));
  }
  return next();
}
