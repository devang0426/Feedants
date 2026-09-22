import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendOk } from '../utils/respond.js';
import { demoLogin, listDemoAccounts, serializeUser } from '../services/authService.js';

export const demoLoginSchema = z.object({
  email: z.string().email().max(120),
  name: z.string().min(1).max(60).optional(),
});

export const postDemoLogin = asyncHandler(async (req, res) => {
  const result = await demoLogin(req.body);
  sendOk(res, result);
});

export const getMe = asyncHandler(async (req, res) => {
  sendOk(res, { user: serializeUser(req.user) });
});

export const getDemoAccounts = asyncHandler(async (req, res) => {
  const accounts = await listDemoAccounts(req.lang);
  sendOk(res, { accounts });
});
