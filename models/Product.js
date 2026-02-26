import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    pid: {
      type: Number,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: value => Number.isFinite(value),
        message: "Price must be a valid number"
      }
    },
    image: {
      type: String
    },
    description: {
      type: String
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
      validate: {
        validator: value => Number.isFinite(value),
        message: "Rating must be a valid number"
      }
    },
    inStock: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['Submitted', 'Approved', 'Rejected', 'Deleted'],
      default: 'Submitted'
    },
    rejectionReason: {
      type: String,
      default: null
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model("products", productSchema);

export default Product;
