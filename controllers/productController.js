import Product from "../models/Product.js";

// GET all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single product by PID
export const getProductById = async (req, res) => {
  const { pid } = req.params;
  console.log('pid', pid);
  try {
    const product = await Product.findOne({ pid: Number(pid) });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST new product
export const createProduct = async (req, res) => {
  const { pid, name, category, price } = req.body;  
  if (!name || !category || !price) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }  
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT update product
export const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { pid: Number(req.params.pid) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE product
export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findOneAndDelete({ pid: Number(req.params.pid) });
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }    
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
