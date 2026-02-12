import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  register,
  login,
  getProfile,
  saveCart,
  loadCart,
  logout
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.post('/cart', authMiddleware, saveCart);
router.get('/cart', authMiddleware, loadCart);
router.post('/logout', authMiddleware, logout);

export default router;

