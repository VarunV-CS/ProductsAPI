import express from "express";
import {
  getProducts,
  createProduct,
  createProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:pid", getProductById);
router.post('/createProduct', createProduct);
router.post('/createProducts', createProducts);
router.put('/updateProduct/:pid', updateProduct);
router.delete('/deleteProduct/:pid', deleteProduct);

export default router;