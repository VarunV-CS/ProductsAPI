import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import config from "./config/index.js";


connectDB();

const app = express();

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

const PORT = config.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});