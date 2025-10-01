const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require("../middleware/auth");
const Review = require("../models/Review");

// Configure multer for review media uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/review-media/');
    console.log('Review media upload destination:', uploadPath);
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const reviewId = req.params.reviewId || 'temp';
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `review_${reviewId}_${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
    console.log('Generated review media filename:', uniqueFileName);
    cb(null, uniqueFileName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  fileFilter: function (req, file, cb) {
    // Allow videos and images
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed!'), false);
    }
  }
});

// Upload review media
router.post('/upload/:reviewId', authenticate, upload.array('media', 11), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    // Validate file limits
    console.log('Uploaded files:', files.map(f => ({ name: f.originalname, type: f.mimetype, size: f.size })));
    const videos = files.filter(file => file.mimetype.startsWith('video/'));
    const photos = files.filter(file => file.mimetype.startsWith('image/'));
    console.log('Videos found:', videos.length, videos.map(v => v.originalname));
    console.log('Photos found:', photos.length, photos.map(p => p.originalname));
    
    if (videos.length > 1) {
      return res.status(400).json({
        success: false,
        message: "Only 1 video is allowed per review"
      });
    }
    
    if (photos.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 photos allowed per review"
      });
    }

    // Validate video size (100MB limit)
    const oversizedVideo = videos.find(video => video.size > 100 * 1024 * 1024);
    if (oversizedVideo) {
      return res.status(400).json({
        success: false,
        message: "Video file size must be less than 100MB"
      });
    }

    // Process uploaded files
    const mediaData = {
      videos: videos.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      })),
      photos: photos.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      }))
    };

    console.log('Processed media data:', JSON.stringify(mediaData, null, 2));

    // Save media data to the review in the database
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found"
        });
      }

      // Add new media to existing media (don't replace)
      if (!review.media) {
        review.media = { videos: [], photos: [] };
      }
      
      // Add new photos to existing photos
      if (mediaData.photos && mediaData.photos.length > 0) {
        review.media.photos.push(...mediaData.photos);
      }
      
      // Add new videos to existing videos
      if (mediaData.videos && mediaData.videos.length > 0) {
        review.media.videos.push(...mediaData.videos);
      }

      await review.save();

      console.log('Media data added to database for review:', reviewId);
      console.log('Updated review media:', review.media);

      res.json({
        success: true,
        message: "Media uploaded and added successfully",
        media: review.media
      });
    } catch (dbError) {
      console.error("Error saving media to database:", dbError);
      res.status(500).json({
        success: false,
        message: "Media uploaded but failed to save to database",
        error: dbError.message
      });
    }

  } catch (error) {
    console.error("Error uploading review media:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Delete individual media from review
router.delete('/delete/:reviewId/:filename', authenticate, async (req, res) => {
  try {
    const { reviewId, filename } = req.params;
    
    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this media"
      });
    }

    // Remove from database
    let removed = false;
    if (review.media && review.media.photos) {
      const photoIndex = review.media.photos.findIndex(photo => photo.filename === filename);
      if (photoIndex !== -1) {
        review.media.photos.splice(photoIndex, 1);
        removed = true;
      }
    }
    
    if (review.media && review.media.videos) {
      const videoIndex = review.media.videos.findIndex(video => video.filename === filename);
      if (videoIndex !== -1) {
        review.media.videos.splice(videoIndex, 1);
        removed = true;
      }
    }

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Media not found in review"
      });
    }

    await review.save();

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../uploads/review-media/', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: "Media deleted successfully",
      media: review.media
    });
  } catch (error) {
    console.error("Error deleting review media:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Delete review media file only (legacy)
router.delete('/delete/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/review-media/', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: "Media file deleted successfully"
      });
    } else {
      res.status(404).json({
        success: false,
        message: "File not found"
      });
    }
  } catch (error) {
    console.error("Error deleting review media:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;
