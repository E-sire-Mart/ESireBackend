// routes/auth.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require("express-validator");

const { authenticate } = require("../middleware/auth");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use absolute path to ensure the folder is found
    const uploadPath = path.join(__dirname, '../uploads/');
    console.log('Upload destination:', uploadPath);
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const userId = req.body.userId;
    const fileExtension = path.extname(file.originalname);
    // Add userId to filename for better organization and uniqueness
    const uniqueFileName = `avatar_${userId}_${Date.now()}${fileExtension}`;
    console.log('Generated filename:', uniqueFileName);
    cb(null, uniqueFileName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});


// Define validation rules
const userValidationRules = [
  body("phone_number").isMobilePhone().withMessage("Phone number is invalid"),
  body("username").notEmpty().withMessage("First name is required"),
  body("first_name").notEmpty().withMessage("First name is required"),
  body("last_name").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Email is invalid"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Password change validation rules
const passwordChangeValidationRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

// Define routes
router.get("/counts", userController.getUsersCounts);
router.get("/", authenticate, userController.getAllUsers);
router.get("/getDeliveryPeople", authenticate, userController.getDeliveryPeople);
router.delete("/deleteDeliveryPerson/:email", userController.deleteDeliveryPerson);
router.post("/", userValidationRules, userController.createUser);
router.delete("/:userId", authenticate, userController.deleteUser);
router.put("/:userId/make-admin", authenticate, userController.makeUserAdmin);
router.get("/profile", authenticate, userController.getUserProfile);
router.put("/change-password", authenticate, passwordChangeValidationRules, userController.changePassword);
router.put("/:userId", userController.updateUser)
router.put("/users/:userId/address", userController.updateAddressUser);
router.post("/fileuploads", upload.single('file'), userController.uploadFile);
router.post("/find-by-email", authenticate, userController.findUserByEmail);
module.exports = router;
