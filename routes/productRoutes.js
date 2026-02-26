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
  getLatestProductId,
  getAllProducts,
  updateProductStatus
} from "../controllers/productController.js";
import authMiddleware from "../middleware/auth.js";
import { sellerMiddleware } from "../middleware/sellerAuth.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/latest-pid", getLatestProductId);
// Admin route - Get all products (including Submitted, Approved, Rejected)
router.get("/all", authMiddleware, getAllProducts);
// Protected route - Get seller's products (seller role required)
router.get("/my-products", authMiddleware, sellerMiddleware, getMyProducts);
router.get("/:pid", getProductById);
// Protected route - Create product (seller role required)
router.post('/createProduct', authMiddleware, sellerMiddleware, createProduct);
router.post('/createProducts', createProducts);
router.put('/updateProduct/:pid', updateProduct);
// Admin route - Update product status (approve/reject)
router.put('/updateStatus/:pid', authMiddleware, updateProductStatus);
router.delete('/deleteProduct/:pid', deleteProduct);

export default router;
