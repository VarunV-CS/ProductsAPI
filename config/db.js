import mongoose from "mongoose";
import config from "./index.js";
import Order from "../models/Order.js";

const connectDB = async () => {
  if (!config.MONGODB_URL) {
    console.error("MONGODB_URL is not defined in environment variables");
    process.exit(1);
  }
  console.log('MONGODB_URL:', config.MONGODB_URL); // Debug log to check the URL being used
  try {
    const conn = await mongoose.connect(
      config.MONGODB_URL
    );
    console.log("MongoDB Connected...", conn.connection.host);

    // One-time schema/index alignment for orders:
    // removes legacy unique paymentIntentId index and applies current indexes.
    const syncedIndexes = await Order.syncIndexes();
    console.log("Order indexes synced:", syncedIndexes);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
