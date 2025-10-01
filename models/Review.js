const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required"],
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating must be at most 5"],
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, "Comment cannot exceed 1000 characters"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0,
  },
  media: {
    type: {
      videos: [{
        filename: String,
        originalName: String,
        size: Number,
        mimetype: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      photos: [{
        filename: String,
        originalName: String,
        size: Number,
        mimetype: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }],
    },
    default: { videos: [], photos: [] },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index to ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Pre-save hook to update the updatedAt field
reviewSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method to calculate average rating for a product
reviewSchema.statics.getAverageRating = async function (productId) {
  try {
    const result = await this.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return result.length > 0
      ? {
          averageRating: Math.round(result[0].averageRating * 10) / 10,
          totalReviews: result[0].totalReviews,
        }
      : { averageRating: 0, totalReviews: 0 };
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return { averageRating: 0, totalReviews: 0 };
  }
};

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;