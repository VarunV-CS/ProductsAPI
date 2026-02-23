import express from "express";
import {
  getProducts,
  createProduct,
  createProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  getMyProducts,
  getLatestProductId
} from "../controllers/productController.js";
import authMiddleware from "../middleware/auth.js";
import { sellerMiddleware } from "../middleware/sellerAuth.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/latest-pid", getLatestProductId);
// Protected route - Get seller's products (seller role required)
router.get("/my-products", authMiddleware, sellerMiddleware, getMyProducts);
router.get("/:pid", getProductById);
// Protected route - Create product (seller role required)
router.post('/createProduct', authMiddleware, sellerMiddleware, createProduct);
router.post('/createProducts', createProducts);
router.put('/updateProduct/:pid', updateProduct);
router.delete('/deleteProduct/:pid', deleteProduct);

export default router;
