import Product from "../models/Product.js";

// GET all products with pagination, filtering, and sorting
export const getProducts = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get filter parameters from query string
    const category = req.query.category;
    const search = req.query.search;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const sortBy = req.query.sortBy || 'createdAt-desc';
    
    // Build filter object
    const filter = {};
    
    // Category filter
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    // Search filter (name or category)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Price range filter
    if (minPrice !== null || maxPrice !== null) {
      filter.price = {};
      if (minPrice !== null) {
        filter.price.$gte = minPrice;
      }
      if (maxPrice !== null) {
        filter.price.$lte = maxPrice;
      }
    }
    
    // Build sort object
    let sortObj = {};
    switch (sortBy) {
      case 'price-asc':
        sortObj = { price: 1 };
        break;
      case 'price-desc':
        sortObj = { price: -1 };
        break;
      case 'name-desc':
        sortObj = { name: -1 };
        break;
      case 'name-asc':
        sortObj = { name: 1 };
        break;
      case 'createdAt-asc':
        sortObj = { createdAt: 1 };
        break;
      case 'createdAt-desc':
      default:
        sortObj = { createdAt: -1 };
        break;
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count of filtered products
    const total = await Product.countDocuments(filter);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    // Fetch products with pagination, filtering, and sorting
    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sortObj);
    
    // Return response with pagination metadata
    res.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    });
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
