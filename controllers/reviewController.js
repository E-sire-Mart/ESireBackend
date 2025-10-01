const Review = require("../models/Review");
const Product = require("../models/Product");
const { ObjectId } = require("mongodb");

// Create a new review
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, media } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product ID and rating are required",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // Create new review
    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment: comment || "",
      media: media || { videos: [], photos: [] },
    });

    console.log('Creating review with media:', review.media);
    await review.save();
    console.log('Review saved with ID:', review._id);

    // Update product's average rating and review count
    await updateProductRating(productId);

    // Populate user information for response
    await review.populate("user", "username email avatar first_name last_name");

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get reviews for a specific product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log('Fetching reviews for product:', productId);

    // Validate product ID
    if (!ObjectId.isValid(productId)) {
      console.log('Invalid product ID:', productId);
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Get reviews with pagination
    const reviews = await Review.find({ product: productId })
      .populate("user", "username email avatar first_name last_name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log('Reviews fetched:', reviews.length);
    reviews.forEach((review, index) => {
      console.log(`Review ${index} media:`, review.media);
    });

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({ product: productId });

    // Get average rating with error handling
    let ratingStats = { averageRating: 0, totalReviews: 0 };
    try {
      ratingStats = await Review.getAverageRating(productId);
    } catch (ratingError) {
      console.error('Error getting rating stats:', ratingError);
      // Use totalReviews from count query as fallback
      ratingStats = { averageRating: 0, totalReviews };
    }

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: page < Math.ceil(totalReviews / limit),
        hasPrev: page > 1,
      },
      ratingStats,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    // Find the review
    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to update it",
      });
    }

    // Update review fields
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Update product's average rating
    await updateProductRating(review.product);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    // Find and delete the review
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it",
      });
    }

    // Update product's average rating
    await updateProductRating(review.product);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: userId })
      .populate("product", "name image price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: page < Math.ceil(totalReviews / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Helper function to update product rating
const updateProductRating = async (productId) => {
  try {
    const ratingStats = await Review.getAverageRating(productId);
    
    await Product.findByIdAndUpdate(productId, {
      averageRating: ratingStats.averageRating,
      totalReviews: ratingStats.totalReviews,
    });
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getUserReviews,
};