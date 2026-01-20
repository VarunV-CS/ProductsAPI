import mongoose from "mongoose";
import config from "./index.js";

const connectDB = async () => {
  try {
    await mongoose.connect(
      config.MONGODB_URL
    );
    console.log("MongoDB Connected...");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;