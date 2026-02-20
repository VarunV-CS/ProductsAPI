import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import Order from '../models/Order.js';

// Initialize Stripe with your secret key
// Note: In production, use environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Create a payment intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', items } = req.body;
    const userId = req.user ? req.user.id : null; // Get user ID from auth middleware

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: uuidv4(),
        itemCount: items ? items.length : 0
      }
    });

    // Store order details in MongoDB
    const orderId = paymentIntent.metadata.orderId;
    const newOrder = new Order({
      userId: req.user.id,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      items: items || [],
      status: 'pending'
    });
    
    await newOrder.save();

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent'
    });
  }
};

// Handle payment success webhook
export const handlePaymentSuccess = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Update order in MongoDB
    const order = await Order.findOne({ paymentIntentId });
    
    if (order) {
      order.status = 'completed';
      await order.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get order status
export const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find order in MongoDB
    const order = await Order.findOne({ _id: orderId, userId: req.user.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Error getting order status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Stripe webhook handler
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && sig) {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For testing without webhook signature
      event = req.body;
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update order status in MongoDB
        const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
        if (order) {
          order.status = 'completed';
          await order.save();
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // Update order status in MongoDB
        const failedOrder = await Order.findOne({ paymentIntentId: failedPayment.id });
        if (failedOrder) {
          failedOrder.status = 'failed';
          await failedOrder.save();
        }
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).json({
      success: false,
      message: `Webhook Error: ${err.message}`
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      paymentStatus: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all orders for a user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { page = 1, limit = 10, status } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Build query - filter by userId and optionally by status
    const query = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch orders from MongoDB with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      id: order._id,
      paymentIntentId: order.paymentIntentId,
      amount: order.amount,
      currency: order.currency,
      items: order.items,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

