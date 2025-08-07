// controllers/authController.js
const User = require("../models/User");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const Shop = require("../models/Shop");
const { json } = require("body-parser");
const path = require("path");
const fs = require("fs");

const getUsersCounts = async (req, res) => {
  try {
    try {
      const counts = await User.countDocuments();
      return res.status(201).json({ counts });
    } catch (validationError) {
      console.log(validationError);
      let message = "Validation error";
      for (let key in validationError.errors) {
        message = validationError.errors[key].message;
      }
      return res.status(400).json({ message });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllUsers = async (req, res) => {
  const isAdmin = await checkAdminStatus(req.user.userId);
  if (!isAdmin)
    return res
      .status(403)
      .send({ success: false, message: "User is not an admin" });

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search;

  try {
    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      total: count,
      pages: Math.ceil(count / limit),
      current_page: page,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Server Error", error: error.message });
  }
};

const getDeliveryPeople = async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId);
  if (user.is_owner) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;

    const shop = await Shop.findOne({ owner: userId });
    const shopId = shop._id;
  
    try {
      const query = { shopId: shopId };
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: "i" } },
          { first_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
        ];
      }
  
      const users = await User.find(query)
        .skip((page - 1) * limit)
        .limit(limit);
  
      const count = await User.countDocuments(query);
  
      res.json({
        success: true,
        data: users,
        total: count,
        pages: Math.ceil(count / limit),
        current_page: page,
      });
    } catch (error) {
      res
        .status(500)
        .send({ success: false, message: "Server Error", error: error.message });
    }
  }
};

const checkAdminStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    return user.isAdmin;
  } catch (err) {
    console.error("Error checking admin status:", err);
    return false;
  }
};

async function hashPassword(password) {
  return bcrypt.hash(password, 8);
}

const createUser = async (req, res) => {
  const isAdmin = await checkAdminStatus(req.user.userId);
  if (!isAdmin)
    return res
      .status(403)
      .send({ success: false, message: "User is not an admin" });
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      phone_number,
      first_name,
      middle_name,
      username,
      last_name,
      publishing_name,
      email,
      password,
      status,
    } = req.body;
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      phone_number,
      first_name,
      username,
      last_name,
      middle_name,
      publishing_name,
      status,
      is_author_completed: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });
    await newUser.save();
    res.status(201).json({
      success: true,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  const isAdmin = await checkAdminStatus(req.user.userId);
  if (!isAdmin)
    return res
      .status(403)
      .send({ success: false, message: "User is not an admin" });

  const userId = req.params.userId;
  try {
    if (userId == undefined)
      return res.status(400).json({ success: false, message: "Id not found" });
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteDeliveryPerson = async (req, res) => {
  const { email } = req.params;
  console.log(req.params);

  try {
    await User.deleteOne({ email: email });
    res.json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const makeUserAdmin = async (req, res) => {
  const userId = req.params.userId;
  try {
    await User.findByIdAndUpdate(userId, { isAdmin: true });
    res.json({ success: true, message: "User is now an admin" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserProfile = async (req, res) => {
  const userId = req.user.userId;
  try {
    if (userId == undefined)
      return res.status(400).json({ success: false, message: "Id not found" });
    const user = await User.findById(userId);

    // console.log(user, "-----------------")
    res.json({user:user, success: true})
    console.log(user, "------dsds-----------------")
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const { first_name, last_name, email, phone_number } = req.body;

  console.log(req.body, "000000000000000asasasasasasas0000000")

  // Ensure at least one field is being updated
  if (!first_name && !last_name && !email && !phone_number) {
    return res.status(400).json({ success: false, message: "At least one field must be updated" });
  }

  try {
    console.log("UserID:", userId);
    console.log("Update data:", { first_name, last_name, email, phone_number });

    // Update user by userId
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        first_name: first_name,
        last_name: last_name,
        email: email,
        phone_number: phone_number,
        updated_at: new Date(),
      },
      { new: true } // Return the updated document
    );

    // Check if user is found
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Send back the updated user
    res.json({
      success: true,
      message: "Profile updated successfully!",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateAddressUser = async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const { city, address, postalCode, street, latitude, longitude, country } = req.body;

  if (!city && !address && !postalCode && !street) {
    return res.status(400).json({ success: false, message: "At least one field must be updated" });
  }

  try {
    console.log("UserID:", userId);
    console.log("Update data:", { city, address, postalCode, street, latitude, longitude, country });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        address: country + "," + city + "," + address + "," + postalCode,
        latitude: latitude,
        longitude: longitude,
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully!",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// File upload endpoint
const uploadFile = async (req, res) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }

    // Check if user exists before proceeding
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    console.log('File upload request:', {
      userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });

    // Validate file type (only images)
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ 
        success: false, 
        message: "Only image files are allowed" 
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        success: false, 
        message: "File size must be less than 5MB" 
      });
    }

    // Use the filename that multer actually saved
    const savedFileName = req.file.filename;
    
    // If user has an existing avatar, delete the old file
    if (existingUser.avatar) {
      const oldAvatarPath = path.join(__dirname, '../uploads/', existingUser.avatar);
      try {
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
          console.log('Deleted old avatar:', existingUser.avatar);
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Don't fail the upload if old file deletion fails
      }
    }
    
    // Update user's avatar in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: savedFileName, // Store the actual saved filename in database
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Return success response
    res.json({
      success: true,
      message: "File uploaded successfully!",
      data: {
        avatar: savedFileName,
        user: updatedUser
      }
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

// Change password endpoint
const changePassword = async (req, res) => {
  console.log("fklsfklshfklshfklshfskkfhsk")
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const userId = req.user.userId; // Get user ID from authenticated request
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user has a password (for Google users who might not have a password)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Password change not allowed for this account type"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Check if new password is same as current password
    const isNewPasswordSame = await user.comparePassword(newPassword);
    if (isNewPasswordSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password"
      });
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update the password
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        password: hashedNewPassword,
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to update password"
      });
    }

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

module.exports = {
  getAllUsers,
  checkAdminStatus,
  createUser,
  deleteUser,
  makeUserAdmin,
  getUserProfile,
  getUsersCounts,
  updateUser,
  updateAddressUser,
  getDeliveryPeople,
  deleteDeliveryPerson,
  uploadFile,
  changePassword
};
