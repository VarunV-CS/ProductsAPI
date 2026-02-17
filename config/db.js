import mongoose from "mongoose";
import config from "./index.js";

const connectDB = async () => {
  if (!config.MONGODB_URL) {
    console.error("MONGODB_URL is not defined in environment variables");
    process.exit(1);
  }
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