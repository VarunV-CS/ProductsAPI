import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  register,
  login,
  getProfile,
  saveCart,
  loadCart,
  logout,
  getAllUsers,
  updateUser,
  changeUserPassword,
  deactivateUser
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
// Admin route - Get all users
router.get('/all-users', authMiddleware, getAllUsers);
// Admin route - Update user
router.put('/update-user/:id', authMiddleware, updateUser);
// Admin route - Change user password
router.put('/change-user-password/:id', authMiddleware, changeUserPassword);
// Admin route - Deactivate user
router.put('/deactivate-user/:id', authMiddleware, deactivateUser);

export default router;

