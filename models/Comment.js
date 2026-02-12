import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    pid: {
      type: Number,
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one comment per product per user
commentSchema.index({ pid: 1, user: 1 }, { unique: true });

// Virtual to check if comment can be edited (within 15 minutes)
commentSchema.virtual('canEdit').get(function () {
  if (!this.createdAt) return false;
  const fifteenMinutes = 15 * 60 * 1000;
  return Date.now() - this.createdAt.getTime() < fifteenMinutes;
});

// Static method to get rating stats for a product
commentSchema.statics.getRatingStats = async function (pid) {
  const stats = await this.aggregate([
    { $match: { pid: Number(pid) } },
    {
      $group: {
        _id: '$pid',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  return stats.length > 0
    ? {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews
      }
    : { averageRating: 0, totalReviews: 0 };
};

const Comment = mongoose.model('comments', commentSchema);

export default Comment;

