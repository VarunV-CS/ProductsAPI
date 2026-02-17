import mongoose from "mongoose";
import config from "./index.js";

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
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;