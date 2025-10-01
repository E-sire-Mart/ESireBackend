const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate } = require("../middleware/auth");

// Review routes
router.post("/", authenticate, reviewController.createReview);
router.get("/product/:productId", reviewController.getProductReviews);
router.put("/:reviewId", authenticate, reviewController.updateReview);
router.delete("/:reviewId", authenticate, reviewController.deleteReview);
router.get("/user/my-reviews", authenticate, reviewController.getUserReviews);

module.exports = router;