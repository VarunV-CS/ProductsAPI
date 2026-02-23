import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// Auth middleware - verifies token
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.'
    });
  }
};

// Seller middleware - verifies user is a seller
export const sellerMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller role required.'
    });
  }

  next();
};

