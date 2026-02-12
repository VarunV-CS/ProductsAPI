import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  addComment,
  getCommentsByProduct,
  updateComment,
  deleteComment,
  getRatingStats
} from '../controllers/commentController.js';

const router = express.Router();

// Public routes
router.get('/product/:pid', getCommentsByProduct);
router.get('/stats/:pid', getRatingStats);

// Protected routes
router.post('/', authMiddleware, addComment);
router.put('/:id', authMiddleware, updateComment);
router.delete('/:id', authMiddleware, deleteComment);

export default router;

