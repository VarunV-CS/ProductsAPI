import Comment from '../models/Comment.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendRatingSubmissionEmail } from '../services/ratingSubmissionService.js';

// @desc    Add a comment to a product
// @route   POST /api/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { pid, rating, comment } = req.body;

    if (!pid || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product ID, rating, and comment'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists
    const product = await Product.findOne({ pid: Number(pid) })
      .populate('user', 'name email businessName');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already commented on this product
    const existingComment = await Comment.findOne({
      pid: Number(pid),
      user: req.user.id
    });

    if (existingComment) {
      return res.status(400).json({
        success: false,
        message: 'You have already commented on this product. Please edit your existing comment.'
      });
    }

    // Create comment
    const newComment = new Comment({
      pid: Number(pid),
      user: req.user.id,
      userName: req.user.name || 'Anonymous',
      rating,
      comment
    });

    await newComment.save();

    try {
      const seller = product.user;
      if (seller?.email) {
        let reviewerEmail = 'N/A';
        if (req.user?.id) {
          const reviewer = await User.findById(req.user.id).select('email').lean();
          reviewerEmail = reviewer?.email || 'N/A';
        }

        await sendRatingSubmissionEmail({
          to: seller.email,
          sellerName: seller.name,
          sellerBusinessName: seller.businessName,
          reviewerName: newComment.userName,
          reviewerEmail,
          rating: newComment.rating,
          comment: newComment.comment,
          product: {
            pid: product.pid,
            name: product.name,
            category: product.category,
            price: product.price
          }
        });
      }
    } catch (emailError) {
      console.error('Failed to send rating submission email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        id: newComment._id,
        pid: newComment.pid,
        user: newComment.user,
        userName: newComment.userName,
        rating: newComment.rating,
        comment: newComment.comment,
        createdAt: newComment.createdAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already commented on this product'
      });
    }
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
};

// @desc    Get comments for a product
// @route   GET /api/comments/product/:pid
// @access  Public
export const getCommentsByProduct = async (req, res) => {
  try {
    const { pid } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if product exists
    const product = await Product.findOne({ pid: Number(pid) });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get total count
    const total = await Comment.countDocuments({ pid: Number(pid) });
    const totalPages = Math.ceil(total / limit);

    // Get comments with pagination
    const comments = await Comment.find({ pid: Number(pid) })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select('-__v');

    // Get rating stats
    const ratingStats = await Comment.getRatingStats(pid);

    res.json({
      success: true,
      comments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      ratingStats
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching comments'
    });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private (owner only)
export const updateComment = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Find comment
    const existingComment = await Comment.findById(req.params.id);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    if (existingComment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Update fields
    if (rating) existingComment.rating = rating;
    if (comment) existingComment.comment = comment;

    await existingComment.save();

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: {
        id: existingComment._id,
        pid: existingComment.pid,
        user: existingComment.user,
        userName: existingComment.userName,
        rating: existingComment.rating,
        comment: existingComment.comment,
        createdAt: existingComment.createdAt,
        updatedAt: existingComment.updatedAt
      }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating comment'
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (owner or admin)
export const deleteComment = async (req, res) => {
  try {
    // Find comment
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership or admin role
    const isOwner = comment.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments or be an admin'
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting comment'
    });
  }
};

// @desc    Get rating statistics for a product
// @route   GET /api/comments/stats/:pid
// @access  Public
export const getRatingStats = async (req, res) => {
  try {
    const { pid } = req.params;

    // Check if product exists
    const product = await Product.findOne({ pid: Number(pid) });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const stats = await Comment.getRatingStats(pid);

    res.json({
      success: true,
      pid: Number(pid),
      ...stats
    });
  } catch (error) {
    console.error('Get rating stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching rating stats'
    });
  }
};

export default {
  addComment,
  getCommentsByProduct,
  updateComment,
  deleteComment,
  getRatingStats
};
