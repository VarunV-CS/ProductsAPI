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
    paymentIntentId: {
      type: String,
      required: true,
      unique: true
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

const Order = mongoose.model('orders', orderSchema);

export default Order;

