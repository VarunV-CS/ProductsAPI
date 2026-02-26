import express from 'express';
import {
  createPaymentIntent,
  handlePaymentSuccess,
  getOrderStatus,
  handleWebhook,
  verifyPayment,
  getUserOrders,
  getAllOrders,
  getSellerOrders,
  updateSellerOrderStatus,
  updateAdminOrderStatus
} from '../controllers/paymentController.js';
import authMiddleware from '../middleware/auth.js';
import { sellerMiddleware } from '../middleware/sellerAuth.js';

const router = express.Router();

// Create payment intent - requires authentication
router.post('/create-payment-intent', authMiddleware, createPaymentIntent);

// Handle payment success (called from frontend after successful payment)
router.post('/payment-success', authMiddleware, handlePaymentSuccess);

// Get order status
router.get('/order/:orderId', authMiddleware, getOrderStatus);

// Verify payment status
router.post('/verify-payment', authMiddleware, verifyPayment);

// Get all orders for the authenticated user
router.get('/orders', authMiddleware, getUserOrders);

// Stripe webhook (must be before express.json() middleware for raw body)
// Note: This route should be added in server.js with raw body parser
router.post('/webhook', handleWebhook);

// Get all orders for admin (all completed orders)
router.get('/admin/orders', authMiddleware, getAllOrders);

// Update order status for admin
router.put('/admin/orders/:orderId/status', authMiddleware, updateAdminOrderStatus);

// Get orders for seller (orders containing their products)
router.get('/seller/orders', authMiddleware, sellerMiddleware, getSellerOrders);

// Update order status for seller
router.put('/seller/orders/:orderId/status', authMiddleware, sellerMiddleware, updateSellerOrderStatus);

export default router;

