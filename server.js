import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import config from "./config/index.js";


const app = express();

// Stripe webhook needs raw body, so we handle it before JSON parser
// This route must come before app.use(express.json())
app.use("/payment/webhook", paymentRoutes);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.json());

const LoggerMiddleware = (req, res, next) => {
  console.log(`Logged  ${req.url}  ${req.method} -- ${new Date()}`);
  next();
};
 
app.use(LoggerMiddleware);

// app.use("/", (req, res) => {
//   res.send("Products API is running...");
// });
app.use("/products", productRoutes);
app.use("/auth", authRoutes);
app.use("/comments", commentRoutes);
app.use("/payment", paymentRoutes);

const PORT = config.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
