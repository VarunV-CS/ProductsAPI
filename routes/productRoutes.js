import express from "express";
import {
  getProducts,
  createProduct,
  createProducts,
  createMultipleProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  getSearchSuggestions,
  getMyProducts,
  getLatestProductId,
  getAllProducts,
  updateProductStatus,
  approveAllProductsBySeller
} from "../controllers/productController.js";
import authMiddleware from "../middleware/auth.js";
import { sellerMiddleware } from "../middleware/sellerAuth.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/suggestions", getSearchSuggestions);
router.get("/latest-pid", getLatestProductId);
// Admin route - Get all products (including Submitted, Approved, Rejected)
router.get("/all", authMiddleware, getAllProducts);
// Protected route - Get seller's products (seller role required)
router.get("/my-products", authMiddleware, sellerMiddleware, getMyProducts);
router.get("/:pid", getProductById);
// Protected route - Create product (seller role required)
router.post('/createProduct', authMiddleware, sellerMiddleware, createProduct);
// Protected route - Create multiple products (seller role required)
router.post('/createMultipleProducts', authMiddleware, sellerMiddleware, createMultipleProducts);
router.post('/createProducts', createProducts);
router.put('/updateProduct/:pid', updateProduct);
// Admin route - Update product status (approve/reject)
router.put('/updateStatus/:pid', authMiddleware, updateProductStatus);

// ============================================================================
// ONE-TIME USE ROUTE - APPROVE ALL PRODUCTS BY SELLER'S BUSINESS NAME
// REMOVE THIS ROUTE AND CONTROLLER FUNCTION AFTER USE
// ============================================================================

// Admin route - Approve all products by seller's business name (NO email)
router.post('/approve-all-by-seller', authMiddleware, approveAllProductsBySeller);

// ============================================================================
// END OF ONE-TIME USE ROUTE
// ============================================================================

router.delete('/deleteProduct/:pid', deleteProduct);

export default router;
