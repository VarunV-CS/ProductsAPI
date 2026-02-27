import mongoose from 'mongoose';

// Order item sub-schema
const orderItemSchema = new mongoose.Schema({
  pid: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String
  },
  category: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

// Order schema
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    orderNumber: {
      type: String,
      default: null,
      index: true
    },
    paymentIntentId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'usd'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'dispatched', 'unfilled', 'delivered', 'returned', 'refunded'],
      default: 'pending'
    },
    parentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'orders',
      default: null
    },
    sellerBusinessName: {
      type: String,
      default: null
    },
    splitProcessed: {
      type: Boolean,
      default: false
    },
    items: [orderItemSchema]
  },
  {
    timestamps: true
  }
);

// Index for efficient querying by userId
orderSchema.index({ userId: 1, createdAt: -1 });
// Index for querying by status
orderSchema.index({ userId: 1, status: 1 });
// Index for webhook/payment-success lookup and split processing
orderSchema.index({ paymentIntentId: 1, parentOrderId: 1, splitProcessed: 1 });

const Order = mongoose.model('orders', orderSchema);

export default Order;
