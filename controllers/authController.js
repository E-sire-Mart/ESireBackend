// controllers/authController.js
const User = require("../models/User");
const Shop = require("../models/Shop");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer")
const { JWT_SECRET, CUSTOMER_URL, SHOP_URL, API_URL } = process.env;
const crypto = require("crypto");
const sendEmail = require("../utils/emailConnection");
const generateVerifyToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

const bcrypt = require("bcrypt");

const CLIENT_URL = process.env.CLIENT_URL;
const VENDER_URL = process.env.VENDER_URL;
const ADMIN_URL = process.env.ADMIN_URL;

// console.log("-----------------", ADMIN_URL, CLIENT_URL, VENDER_URL)

// const transporter = nodemailer.createTransport({
//   service:"Gmail",
//   auth:{
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   },
// })

const ownerRegister = async (req, res) => {
  try {
    console.log("Received request body:", JSON.stringify(req.body, null, 2));
    
    const { email, password, first_name, last_name, phone_number, is_owner, store_name, social_media } =
      req.body.data.attributes;
    
    console.log("Extracted data:", { email, password, first_name, last_name, phone_number, is_owner, store_name, social_media });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      // User already exists, check if they're already a store owner
      if (existingUser.is_owner) {
        return res.status(400).json({ 
          message: "This email is already registered as a store owner. Please use a different email or contact support." 
        });
      }
      
      // Update existing user to be a store owner and create shop
      try {
        // Update user to be store owner
        existingUser.is_owner = true;
        existingUser.first_name = first_name;
        existingUser.last_name = last_name;
        existingUser.phone_number = phone_number;
        
        // If password is provided, update it
        if (password) {
          existingUser.password = password;
        }
        
        await existingUser.save();
        
        // Create shop for the user (pending approval)
        const Shop = require('../models/Shop');
        const newShop = new Shop({
          name: store_name,
          owner: existingUser._id,
          socialMedia: {
            instagram: social_media,
            facebook: '',
            twitter: ''
          },
          approved: false // New shops need admin approval
        });
        
        await newShop.save();
        
        // Link shop to user
        existingUser.shopId = newShop._id;
        await existingUser.save();
        
        // Send verification email if not already verified
        if (!existingUser.isVerified) {
          existingUser.verify_token = generateVerifyToken();
          await existingUser.save();
          await sendEmail(email, existingUser.verify_token, API_URL, "verification");
        }
        
        // TODO: Send notification to admin about pending store approval
        // This should trigger an admin notification for store approval
        
        return res.status(200).json({ 
          message: "Store registration submitted successfully! Your store is pending admin approval. You will be notified once approved.",
          shopId: newShop._id,
          status: "pending_approval"
        });
      } catch (updateError) {
        console.log("Update error details:", updateError);
        let message = "Failed to upgrade account to store owner";
        if (updateError.errors) {
          for (let key in updateError.errors) {
            console.log(`Field ${key}: ${updateError.errors[key].message}`);
            message = updateError.errors[key].message;
          }
        } else {
          message = updateError.message || "Failed to upgrade account to store owner";
        }
        return res.status(400).json({ message });
      }
    } else {
      // User doesn't exist, create new store owner and shop
      try {
        // Create new user as store owner
        const user = new User({
          email: email.toLowerCase(),
          username: email.toLowerCase(),
          password,
          first_name,
          last_name,
          phone_number,
          is_owner: true,
        });
        
        user.verify_token = generateVerifyToken();
        await user.save();
        
        // Create shop for the user (pending approval)
        const Shop = require('../models/Shop');
        const newShop = new Shop({
          name: store_name,
          owner: user._id,
          socialMedia: {
            instagram: social_media,
            facebook: '',
            twitter: ''
          },
          approved: false // New shops need admin approval
        });
        
        await newShop.save();
        
        // Link shop to user
        user.shopId = newShop._id;
        await user.save();
        
        await sendEmail(email, user.verify_token, API_URL, "verification");
        
        // TODO: Send notification to admin about pending store approval
        // This should trigger an admin notification for store approval
        
        return res.status(201).json({ 
          message: "Store registration submitted successfully! Your store is pending admin approval. You will be notified once approved.",
          shopId: newShop._id,
          status: "pending_approval"
        });
      } catch (validationError) {
        console.log("Validation error details:", validationError);
        let message = "Validation error";
        if (validationError.errors) {
          for (let key in validationError.errors) {
            console.log(`Field ${key}: ${validationError.errors[key].message}`);
            message = validationError.errors[key].message;
          }
        } else {
          message = validationError.message || "Validation error";
        }
        return res.status(400).json({ message });
      }
    }
  } catch (error) {
    console.log("General error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const userRegister = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      longitude,
      latitude,
    } = req.body;
    const user = new User({
      email,
      username: first_name + " " + last_name,
      password,
      first_name,
      last_name,
      phone_number,
      longitude,
      latitude,
    });

    try {
      user.verify_token = generateVerifyToken();
      // console.log(generateVerifyToken());

      await user.save();
      await sendEmail(email, user.verify_token, API_URL, "verification");
      return res.status(201).json({
        message: "Success",
        username: user.username,
        email,
        phone_number,
        longitude,
        latitude,
      });
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

const userRegisterApp = async (req, res) => {
  console.log(req.body);

  try {
    const { email, password, first_name, last_name, phone_number, username } =
      req.body;
    const user = new User({
      email,
      username: username,
      password,
      first_name,
      last_name,
      phone_number,
    });
    console.log(user, '---------------------------------------------');

    try {
      user.verify_token = generateVerifyToken();
      console.log(generateVerifyToken(), '====================================');

      await user.save();
      await sendEmail(email, user.verify_token, API_URL, "verification");
      // return res.status(201).json({ message: 'User registered successfully' });
      return res.status(201).json({
        message: "Success",
        username,
        email,
        phone_number,
      });
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

const deliverymanRegister = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      shopname,
    } = req.body;

    if (
      !email ||
      !password ||
      !first_name ||
      !last_name ||
      !phone_number ||
      !shopname
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const shop = await Shop.findOne({ name: shopname });

    if (!shop) {
      return res.status(400).json({ message: "Shop does not exist" });
    }

    const user = new User({
      email,
      username: first_name + last_name,
      password,
      first_name,
      last_name,
      phone_number,
      shopname: shop.name,
      shopId: shop._id,
      isDelivery: true,
      isVerified: false
    });

    try {
      user.verify_token = generateVerifyToken();
      await user.save();
      await sendEmail(email, user.verify_token, API_URL, "verification");
      return res.status(201).json({
        message: "Success",
        shopname,
        first_name,
        last_name,
        email,
        phone_number,
      });
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

const deliverymanRegisterWithOwner = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
    } = req.body;

    const shopOwnerId = req.user.userId;

    if (
      !email ||
      !password ||
      !first_name ||
      !last_name ||
      !phone_number
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const shop = await Shop.findOne({ owner: shopOwnerId });

    if (!shop) {
      return res.status(400).json({ message: "Shop does not exist" });
    }

    const user = new User({
      email,
      username: first_name + last_name,
      password,
      first_name,
      last_name,
      phone_number,
      shopname: shop.name,
      shopId: shop._id,
      isDelivery: true,
    });

    try {
      user.verify_token = generateVerifyToken();
      await user.save();
      await sendEmail(email, user.verify_token, API_URL, "verification");
      return res.status(201).json({
        success: true,
        message: "Person created successfully.",
      });
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

const adminregister = async (req, res) => {
  try {
    // Handle both nested and flat request body structures
    const requestData = req.body.data?.attributes || req.body;
    const { email, password, first_name, last_name, phone_number } = requestData;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        message: "Email, password, first_name, and last_name are required"
      });
    }

    // Check if user already exists (email is automatically converted to lowercase by mongoose)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const user = new User({
      email: email.toLowerCase(), // Ensure email is lowercase
      username: email.toLowerCase(), // Use email as username
      password,
      first_name,
      last_name,
      phone_number,
      isAdmin: true, // Set admin flag
      isVerified: false, // Will be verified via email
    });

    try {
      user.verify_token = generateVerifyToken();
      await user.save();

      // Send verification email
      await sendEmail(email, user.verify_token, API_URL, "verification");

      return res.status(201).json({
        message: "Admin registered successfully. Please check your email for verification.",
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      });
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

const checkStoreStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }

    const user = await User.findById(userId).populate('shopId');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if user is a store owner
    if (!user.is_owner || !user.shopId) {
      return res.status(200).json({
        success: true,
        isStoreOwner: false,
        message: "User is not a store owner"
      });
    }

    // Check if store is approved
    const shop = user.shopId;
    const isApproved = shop.approved;

    return res.status(200).json({
      success: true,
      isStoreOwner: true,
      isApproved: isApproved,
      shopId: shop._id,
      shopName: shop.name,
      status: isApproved ? "approved" : "pending_approval",
      message: isApproved 
        ? "Store is approved and active" 
        : "Store is pending admin approval"
    });

  } catch (error) {
    console.error("Check store status error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body.data.attributes;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        errors: [{ detail: "Please sign up..." }],
      });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({
        errors: [{ detail: "Invalid password..." }],
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        errors: [{ detail: "Please verify your account..." }],
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7h" }
    );

    return res.json({
      token_type: "Bearer",
      expires_in: "7h",
      access_token: token,
      refresh_token: token,
    });
  } catch (error) {
    return res.status(400).json({
      errors: [{ detail: "Internal Server Error" }],
    });
  }
};

const loginapp = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        errors: [{ detail: "There are no registered users." }],
      });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({
        errors: [{ detail: "Passwords do not match." }],
      });
    }
    if (!user.isVerified) {
      return res.status(400).json({
        errors: [{ detail: "Please verify your account..." }],
      });
    }
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        is_owner: user.is_owner,
        isAdmin: user.isAdmin,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      JWT_SECRET,
      { expiresIn: "7h" }
    );

    return res.json({
      token_type: "Bearer",
      expires_in: "7h",
      access_token: token,
      refresh_token: token,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      userId: user._id,
      is_owner: user.is_owner,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      errors: [{ detail: "Internal Server Error" }],
    });
  }
};

const deliverymanLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // If no user is found, return an error
    if (!user) {
      return res.status(400).json({
        errors: [{ detail: "There are no registered users." }],
      });
    }

    // Check if the provided password matches the stored hashed password
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({
        errors: [{ detail: "Passwords do not match." }],
      });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        errors: [{ detail: "Please verify your account..." }],
      });
    }

    // Check if the user has an associated shop
    if (!user.shopId) {
      return res.status(400).json({
        errors: [{ detail: "User does not have an associated shop." }],
      });
    }

    // Find the shop in the Shop database using the shopId from the user
    const shop = await Shop.findById(user.shopId);

    if (!shop) {
      return res.status(400).json({
        errors: [{ detail: "Shop does not exist." }],
      });
    }

    // Compare the shop IDs and if they match, include shop data in the response
    if (user.shopId.toString() !== shop._id.toString()) {
      return res.status(400).json({
        errors: [{ detail: "User shop ID does not match the shop database." }],
      });
    }

    // Generate JWT token for authentication
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        is_owner: user.is_owner,
        isAdmin: user.isAdmin,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      JWT_SECRET,
      { expiresIn: "7h" }
    );

    // Send the response with user and shop data
    return res.json({
      token_type: "Bearer",
      expires_in: "7h",
      access_token: token,
      refresh_token: token,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      userId: user._id,
      shopData: {
        shopname: shop.name,
        shopaddress: shop.address,
        owner: shop.shopowner,
        otherDetails: shop.otherDetails, // Include any additional shop data here
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      errors: [{ detail: "Internal Server Error" }],
    });
  }
};

const logout = async (req, res) => {
  return res.sendStatus(204);
};

const verify = async (req, res) => {
  const { token } = req.params;
  console.log("token------", token)
  try {
    const user = await User.findOne({ verify_token: token });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or token is invalid" });
    }

    user.isVerified = true;
    await user.save();
    if (user.is_owner) {
      const newShop = new Shop({
        name: `${user.first_name + " " + user.last_name}'s Shop`,
        owner: user._id,
      });
      await newShop.save();
      //TODO: endpoint gded bt3ml approved 3 l shop
    }

    const redirectUrl = user.is_owner
      ? `${`${VENDER_URL}auth/login?verified=true`}/auth/login`
      : `${CLIENT_URL}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate reset token and save it to the user
    const token = generateVerifyToken();
    user.verify_token = token;
    await user.save();

    // Send password reset email with the token
    const resetUrl = `${CUSTOMER_URL}/reset-password/${token}`;
    await sendEmail(email, token, resetUrl, "resetPassword");

    return res
      .status(200)
      .json({ message: "Password reset token sent to email." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  const { password, token, email } = req.body;

  try {
    // Find user by token and email
    const user = await User.findOne({ email, verify_token: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Update user's password and clear the token
    user.password = password;
    user.verify_token = undefined; // Clear the token after successful password reset
    await user.save();

    return res
      .status(200)
      .json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const { email, first_name, last_name } = req.body;

    // Log the received data
    console.log("Request body:", req.body);

    // Check if the user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, generate a JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          username: user.username,
          is_owner: user.is_owner,
          isAdmin: user.isAdmin,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        },
        JWT_SECRET,
        { expiresIn: "7h" }
      );

      return res.json({
        token_type: "Bearer",
        expires_in: "7h",
        access_token: token,
        refresh_token: token,
      });
    } else {
      // Create a new user with a default password
      user = new User({
        email,
        first_name,
        last_name,
        username: first_name + last_name,  // Use email as the username
        password: "123456789",  // Placeholder password
        isGoogle: true,
        isVerified: true,  // Assume Google users are verified
      });
      await user.save();

      const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: "7h" }
      );

      return res.json({
        token_type: "Bearer",
        expires_in: "7h",
        access_token: token,
        refresh_token: token,
      });
    }
  } catch (error) {
    console.error("Error processing Google login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginAsAdmin = async (req, res) => {
  const { token, shopId } = req.body;

  console.log("-----------", req.body);

  if (req.body == null) {
    return res.status(400).json({ message: 'muahahahahahahah' })
  }

  if (!token || !shopId) {
    return res.status(400).json({ message: 'Token and shopId are required' });
  }

  try {
    // Verify the token and extract userId
    const decodedToken = jwt.verify(token, JWT_SECRET);
    const { userId } = decodedToken;

    // Find the user in the database by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is an admin
    if (user.isAdmin === true) {
      // Find the shop by shopId
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      // Find the owner of the shop in the User model
      const owner = await User.findById(shop.owner);
      if (!owner) {
        return res.status(404).json({ message: 'Shop owner not found' });
      }

      // Create access token and refresh token
      const accessToken = jwt.sign(
        { 
          userId: owner._id, 
          username: owner.username,
          is_owner: owner.is_owner,
          isAdmin: owner.isAdmin,
          email: owner.email,
          first_name: owner.first_name,
          last_name: owner.last_name
        },
        JWT_SECRET,
        { expiresIn: "7h" }  // Access token valid for 7 hours
      );

      const refreshToken = jwt.sign(
        { 
          userId: owner._id, 
          username: owner.username,
          is_owner: owner.is_owner,
          isAdmin: owner.isAdmin,
          email: owner.email,
          first_name: owner.first_name,
          last_name: owner.last_name
        },
        JWT_SECRET,
        { expiresIn: "30d" }  // Refresh token valid for 30 days
      );

      // Send the tokens to the frontend
      return res.json({
        token_type: "Bearer",
        expires_in: "7h",  // Expiration for the access token
        access_token: accessToken,
        refresh_token: refreshToken,  // Long-lived refresh token
      });

    } else {
      return res.status(403).json({ message: 'Access denied. User is not an admin.' });
    }

  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    // Handle both nested and flat request body structures
    const requestData = req.body.data?.attributes || req.body;
    const { email, password } = requestData;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email (email is automatically converted to lowercase by mongoose)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        errors: [{ detail: "Admin not found. Please register first." }],
      });
    }

    // Check if user is an admin
    if (!user.isAdmin) {
      return res.status(403).json({
        errors: [{ detail: "Access denied. This account is not an admin account." }],
      });
    }

    // Check password
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({
        errors: [{ detail: "Invalid password" }],
      });
    }

    // Check if account is verified
    if (!user.isVerified) {
      return res.status(400).json({
        errors: [{ detail: "Please verify your account first. Check your email for verification link." }],
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        isAdmin: user.isAdmin
      },
      JWT_SECRET,
      { expiresIn: "7h" }
    );

    return res.json({
      token_type: "Bearer",
      expires_in: "7h",
      access_token: token,
      refresh_token: token,
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      errors: [{ detail: "Internal Server Error" }],
    });
  }
};

const resend_verify = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified) return res.status(400).json({ message: "Already verified" });

  user.verify_token = crypto.randomBytes(32).toString("hex");
  await user.save();
  await sendEmail(user.email, user.verify_token);
  res.json({ message: "Verification email resent" });
};


// const loginAsAdmin = async (req, res) => {

//   //  const { email, password } = req.body.data.attributes;

//    console.log(req.body)
//    try {
//     const { email, password } = req.body.data.attributes;

//     // console.log("-----------------", email, password)
//     // Check required fields
//     if (!email || !password) {
//       return res.status(400).json({ message: "Email and password are required." });
//     }

//     // Find user by email
//     const user = await User.findOne({ email: email});

//     // console.log('-------------', user)

//     if (!user) {
//       return res.status(401).json({ message: "User not found." });
//     }

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid password." });
//     }

//     // Optional: generate token
//     const token = jwt.sign(
//       { userId: user._id, email: user.email, isAdmin: user.isAdmin },
//       JWT_SECRET,
//       { expiresIn: "7h" }
//     );

//     // Respond with user info
//     return res.status(200).json({
//       message: "Login successful.",
//       isAdmin: user.isAdmin,
//       verify_token: token,
//     });
//   } catch (error) {
//     console.error("Sign-in error:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// }


const goToMyShop = async (req,res) => {
  try {
    // Optional: build context (e.g., SSO token or user id)
    // const userId = req.user?.id; // if you attach user from auth middleware
    // const ssoToken = createShortLivedToken({ userId });

    const vendorBase = process.env.VENDOR_DASHBOARD_URL || 'http://localhost:4000';

    // Optional: allow passing a target path (must start with '/')
    const path = typeof req.query.path === 'string' && req.query.path.startsWith('/')
      ? req.query.path
      : '/';

    const url = new URL(path, vendorBase);
    // Optional: attach params (e.g., sso)
    // url.searchParams.set('sso', ssoToken);

    // Prevent caching the redirect
    res.setHeader('Cache-Control', 'no-store');
    // 302 is fine here since we’re changing location; 307 if you ever POST
    return res.redirect(302, url.toString());
  } catch (err) {
    console.error('gotomyshop redirect failed:', err);
    return res.status(500).json({ success: false, message: 'Redirect failed' });
  }
};


module.exports = {
  ownerRegister,
  checkStoreStatus,
  login,
  loginapp,
  logout,
  verify,
  forgotPassword,
  resetPassword,
  adminregister,
  deliverymanRegister,
  deliverymanRegisterWithOwner,
  userRegister,
  userRegisterApp,
  deliverymanLogin,
  loginWithGoogle,
  loginAsAdmin,
  adminLogin,
  resend_verify,
  goToMyShop
};
