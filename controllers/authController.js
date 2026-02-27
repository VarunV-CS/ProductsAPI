import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';
import { sendVerificationEmail } from '../services/emailServices.js';

// Generate JWT token
const generateToken = (userId, name, role) => {
  return jwt.sign({ id: userId, name, role }, config.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role, businessName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate businessName for sellers
    if (role === 'seller' && !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required for sellers'
      });
    }

    if (role === 'seller' && businessName && businessName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Business name must be at least 3 characters'
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'buyer',
      businessName: role === 'seller' ? businessName.trim() : undefined
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.name, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        cart: user.cart,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password'
      });
    }

    // Determine if input is email or name
    // If it contains '@', treat as email, otherwise treat as name
    const isEmail = email.includes('@');
    
    // Find user by email or name (case-insensitive for name)
    let user;
    if (isEmail) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = await User.findOne({ name: { $regex: new RegExp(`^${email.trim()}$`, 'i') } });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: isEmail ? 'Invalid email or password' : 'Invalid username or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: isEmail ? 'Invalid email or password' : 'Invalid username or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.name, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        cart: user.cart,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        cart: user.cart,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Save user cart
// @route   POST /api/auth/cart
// @access  Private
export const saveCart = async (req, res) => {
  try {
    const { cart } = req.body;

    // Update user's cart
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { cart },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Cart saved successfully',
      cart: user.cart
    });
  } catch (error) {
    console.error('Save cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving cart'
    });
  }
};

// @desc    Load user cart
// @route   GET /api/auth/cart
// @access  Private
export const loadCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('cart');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      cart: user.cart || []
    });
  } catch (error) {
    console.error('Load cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error loading cart'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/all-users?role=admin|seller|buyer&page=1&limit=10
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Get pagination and filter parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const roleFilter = req.query.role || 'all';

    // Build query based on role filter
    const query = {};
    if (roleFilter && roleFilter !== 'all') {
      query.role = roleFilter;
    }
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get users with pagination and optional role filter
    const users = await User.find(query)
      .select('-password')
      .lean()
      .skip(skip)
      .limit(limit);
    
    // Get product count for each user by counting products in Product collection
    const Product = (await import('../models/Product.js')).default;
    
    // Transform users to include product count
    const usersWithProductCount = await Promise.all(
      users.map(async (user) => {
        const productCount = await Product.countDocuments({ user: user._id });
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          businessName: user.businessName,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          productCount,
          isActive: user.isActive !== false,
          isVerified: user.isVerified || false
        };
      })
    );

    res.json({
      success: true,
      users: usersWithProductCount,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};

// @desc    Update user (admin can update name, businessName, role)
// @route   PUT /api/auth/update-user/:id
// @access  Private (Admin)
export const updateUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const { name, businessName, role } = req.body;

    // Find the user to update
    const userToUpdate = await User.findById(id);
    
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role (to avoid lockout)
    if (userToUpdate._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own admin account'
      });
    }

    // Validate role if provided
    if (role && !['buyer', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be buyer, seller, or admin'
      });
    }

    // Validate businessName for sellers
    if (role === 'seller' || userToUpdate.role === 'seller') {
      if ((role === 'seller' || userToUpdate.role === 'seller') && !businessName && !userToUpdate.businessName) {
        return res.status(400).json({
          success: false,
          message: 'Business name is required for sellers'
        });
      }
    }

    // Update fields
    if (name) userToUpdate.name = name;
    if (businessName) userToUpdate.businessName = businessName;
    if (role) userToUpdate.role = role;

    await userToUpdate.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: userToUpdate._id,
        name: userToUpdate.name,
        email: userToUpdate.email,
        role: userToUpdate.role,
        businessName: userToUpdate.businessName,
        createdAt: userToUpdate.createdAt,
        lastLogin: userToUpdate.lastLogin
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
};

// @desc    Change user password (admin verified)
// @route   PUT /api/auth/change-user-password/:id
// @access  Private (Admin)
export const changeUserPassword = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const { newPassword, adminPassword } = req.body;

    // First verify the admin's password
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    const isAdminPasswordValid = await adminUser.comparePassword(adminPassword);
    if (!isAdminPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin password'
      });
    }

    // Find the user whose password is being changed
    const userToUpdate = await User.findById(id);
    
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    userToUpdate.password = newPassword;
    await userToUpdate.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// @desc    Deactivate user account
// @route   PUT /api/auth/deactivate-user/:id
// @access  Private (Admin)
export const deactivateUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;

    // Find the user to deactivate
    const userToDeactivate = await User.findById(id);
    
    if (!userToDeactivate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating their own account
    if (userToDeactivate._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Add isActive field if it doesn't exist and set to false
    userToDeactivate.isActive = false;
    await userToDeactivate.save();

    res.json({
      success: true,
      message: 'User account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deactivating user'
    });
  }
};

export const requestEmailVerification = async (req, res) => {
  const { email } = req.body;

  try {
    const exsistingEmail = await UserModal.findOne({ email: email.toLowerCase()
    .collation({ locale: 'en', strength: 2 })
    .exec() });
    
    if (!exsistingEmail) {
      throw createHttpError(409, 'A user with this email does not exist');
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString(); 
    // Generate a 6-digit token

    await EmailVerificationToken.create(
      {email, verificationCode});

    await Email.sendVerificationCode(email, verificationCode);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }

    const verificationTokenExpiry = Date.now() + 3600000; // 1 hour
};

// @desc    Send verification OTP to user
// @route   POST /api/auth/send-verification-otp
// @access  Private
export const sendVerificationOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP expiry to 5 minutes from now
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP and expiry to user
    user.verificationOTP = otp;
    user.verificationOTPExpiry = otpExpiry;
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, otp);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Verification OTP sent to your email'
    });
  } catch (error) {
    console.error('Send verification OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending verification OTP'
    });
  }
};

// @desc    Verify OTP and mark user as verified
// @route   POST /api/auth/verify-otp
// @access  Private
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the verification code'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    // Check if OTP exists
    if (!user.verificationOTP || !user.verificationOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new code.'
      });
    }

    // Check if OTP has expired
    if (new Date() > user.verificationOTPExpiry) {
      // Clear expired OTP
      user.verificationOTP = null;
      user.verificationOTPExpiry = null;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Check if OTP matches
    if (user.verificationOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // OTP is valid - mark user as verified
    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationOTPExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: 'Account verified successfully!'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying OTP'
    });
  }
};


export default {
  register,
  login,
  getProfile,
  saveCart,
  loadCart,
  logout,
  getAllUsers,
  updateUser,
  changeUserPassword,
  deactivateUser
};
