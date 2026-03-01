import Product from "../models/Product.js";
import User from "../models/User.js";
import { sendProductStatusUpdateEmail } from "../services/productReviewService.js";

// GET all products with pagination, filtering, and sorting
// Only returns "Approved" products for customers
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
    
    // Build filter object - ONLY show Approved products to customers
    const filter = { status: 'Approved' };
    
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

// GET seller's products (protected) - with optional status filter
export const getMyProducts = async (req, res) => {
  try {
    const { status } = req.query;
    
    const user = await User.findById(req.user.id).select('products');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let products = user.products || [];
    
    // Apply status filter if provided
    if (status && status !== 'all') {
      products = products.filter(p => p.status === status);
    }

    res.json({
      success: true,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single product by PID
export const getProductById = async (req, res) => {
  const { pid } = req.params;
  console.log('pid', pid);
  try {
    const product = await Product.findOne({ pid: Number(pid) })
      .populate('user', 'businessName name');
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET latest product ID
export const getLatestProductId = async (req, res) => {
  try {
    // Find the product with the highest pid
    const latestProduct = await Product.findOne().sort({ pid: -1 });
    
    if (!latestProduct) {
      // If no products exist, start with ID 1
      return res.json({ latestPid: 0 });
    }
    
    res.json({ latestPid: latestProduct.pid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST new product (with auth - adds to user's products)
export const createProduct = async (req, res) => {
  const { pid, name, category, price, image, description, inStock } = req.body;  
  if (!name || !category || !price) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }  
  try {
    const product = new Product({
      ...req.body,
      user: req.user ? req.user.id : null
    });
    const savedProduct = await product.save();
    
    // If user is authenticated, add product to their products array
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          products: {
            pid: savedProduct.pid,
            name: savedProduct.name,
            category: savedProduct.category,
            price: savedProduct.price,
            image: savedProduct.image,
            description: savedProduct.description,
            inStock: savedProduct.inStock,
            status: savedProduct.status || 'Submitted'
          }
        }
      });
    }
    
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

// GET all products for admin (including Submitted, Approved, Rejected)
export const getAllProducts = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Get filter parameters from query string
    const status = req.query.status;
    const category = req.query.category;
    const search = req.query.search;
    
    // Build filter object - admin can see all products
    const filter = {};
    
    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }
    
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
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count of filtered products
    const total = await Product.countDocuments(filter);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    // Fetch products with pagination, filtering, and populate user info
    const products = await Product.find(filter)
      .populate('user', 'name email businessName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1, pid: -1 });
    
    // Transform products to include username
    const productsWithUser = products.map(product => {
      const productObj = product.toObject();
      // Determine username - prefer businessName, then name, then email
      let username = 'Unknown';
      if (productObj.user) {
        username = productObj.user.businessName || productObj.user.name || productObj.user.email;
      }
      return {
        ...productObj,
        username,
        sellerName: productObj.user?.name || '',
        sellerBusinessName: productObj.user?.businessName || ''
      };
    });
    
    // Return response with pagination metadata
    res.json({
      products: productsWithUser,
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

// PUT update product status (for admin approval/rejection)
export const updateProductStatus = async (req, res) => {
  const { pid } = req.params;
  const { status, rejectionReason } = req.body;
  
  // Validate status - Admin can set to Approved, Rejected, or Deleted
  // "Submitted" is the initial status for new products from sellers
  if (!['Approved', 'Rejected', 'Deleted'].includes(status)) {
    return res.status(400).json({ message: "Invalid status. Admin can only set status to 'Approved', 'Rejected', or 'Deleted'" });
  }
  
  // If status is Rejected, rejectionReason is required
  if (status === 'Rejected' && !rejectionReason) {
    return res.status(400).json({ message: "Rejection reason is required when rejecting a product" });
  }
  
  try {
    // Build update object
    const updateData = { status: status };
    
    // If rejecting, add the rejection reason
    if (status === 'Rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else if (status === 'Approved') {
      // Clear rejection reason when approving
      updateData.rejectionReason = null;
    }
    
    const updatedProduct = await Product.findOneAndUpdate(
      { pid: Number(pid) },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Also update in user's products array
    await User.updateMany(
      { "products.pid": Number(pid) },
      { 
        $set: { 
          "products.$.status": status,
          ...(status === 'Rejected' && rejectionReason ? { "products.$.rejectionReason": rejectionReason } : {}),
          ...(status === 'Approved' ? { "products.$.rejectionReason": null } : {})
        }
      }
    );

    if (status === 'Approved' || status === 'Rejected') {
      try {
        const seller = updatedProduct.user
          ? await User.findById(updatedProduct.user).select('email name businessName')
          : null;

        if (seller?.email) {
          let actorLabel = req.user?.name || 'Admin';
          if (req.user?.id) {
            const adminUser = await User.findById(req.user.id).select('name email businessName');
            if (adminUser) {
              actorLabel = adminUser.businessName || adminUser.name || adminUser.email || actorLabel;
            }
          }

          await sendProductStatusUpdateEmail({
            to: seller.email,
            status,
            product: updatedProduct,
            actionBy: actorLabel,
            rejectionReason: status === 'Rejected' ? rejectionReason : null,
            sellerName: seller.name,
            sellerBusinessName: seller.businessName
          });
        }
      } catch (emailError) {
        console.error('Failed to send product status email:', emailError);
      }
    }
    
    res.json({
      success: true,
      message: `Product ${status.toLowerCase()} successfully`,
      product: updatedProduct
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST multiple products at once (bulk create)
export const createProducts = async (req, res) => {
  const { products } = req.body;
  
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Please provide an array of products" });
  }
  
  // Validate each product
  for (const product of products) {
    if (!product.name || !product.category || !product.price) {
      return res.status(400).json({ 
        message: "Each product must have name, category, and price fields" 
      });
    }
  }
  
  try {
    const savedProducts = await Product.insertMany(products);
    res.status(201).json({
      success: true,
      message: `${savedProducts.length} products created successfully`,
      products: savedProducts
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
