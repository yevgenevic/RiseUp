import { Router, Request, Response } from 'express';
import { register, login, logout, refreshToken } from './auth.controller.js';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

export default router;
