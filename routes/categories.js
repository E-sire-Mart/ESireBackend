const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the destination folder for images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Image size must be less than 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      message: error.message
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: error.message
    });
  }
  next();
};

// Apply authentication middleware to all routes
// router.use(authenticate); // Temporarily disabled for testing

// GET /api/v1/categories - Get all categories as tree
router.get('/', categoryController.getAllCategories);

// GET /api/v1/categories/root - Get root categories
router.get('/root', categoryController.getRootCategories);

// GET /api/v1/categories/parent/:parentId - Get categories by parent
router.get('/parent/:parentId', categoryController.getCategoriesByParent);

// GET /api/v1/categories/:id - Get category by ID
router.get('/:id', categoryController.getCategoryById);

// POST /api/v1/categories - Create new category
router.post('/', upload.single('image'), handleMulterError, categoryController.createCategory);

// PUT /api/v1/categories/:id - Update category
router.put('/:id', upload.single('image'), handleMulterError, categoryController.updateCategory);

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', categoryController.deleteCategory);

// PATCH /api/v1/categories/:id/move - Move category to different parent
router.patch('/:id/move', categoryController.moveCategory);

// PATCH /api/v1/categories/reorder - Reorder categories
router.patch('/reorder', categoryController.reorderCategories);

module.exports = router;
