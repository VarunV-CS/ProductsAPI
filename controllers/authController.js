import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';

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
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'buyer'
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
        cart: user.cart
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

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
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
        cart: user.cart
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
        cart: user.cart,
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

export default {
  register,
  login,
  getProfile,
  saveCart,
  loadCart
};

