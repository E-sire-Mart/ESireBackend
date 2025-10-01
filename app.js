// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const http = require("http");

// Import custom modules and middleware
const { authenticate } = require("./middleware/auth");
const { handleStripeWebhook, handleSuccess } = require("./controllers/orderController");
const connectDB = require("./db/connection");
const { seedData } = require('./utils/seedData');
const SocketServer = require('./socketServer');

// Initialize Express app
const app = express();

app.use('/uploads', express.static('uploads'));

// Create an HTTP server with Express
const server = http.createServer(app);

// Middleware options for CORS
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true); // Allow requests from all origins
  },
  credentials: true, // Allow credentials (cookies, HTTP authentication)
};

// Connect to MongoDB using the connection function
connectDB();

// Configure middleware
app.use(cors(corsOptions)); // Enable CORS with options
app.use(bodyParser.json({ type: "application/vnd.api+json", strict: false })); // Parse JSON bodies with specific MIME type



// Parse URL-encoded bodies, but exclude multipart form data
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
})); 

// Parse JSON bodies, but exclude multipart form data
app.use(express.json({ limit: '10mb' })); 

app.use("/uploads", express.static("uploads")); // Serve static files from "uploads" directory

// Import route modules
const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const productRouter = require("./routes/products");
const shopRouter = require("./routes/shops");
const orderRouter = require("./routes/order");
const cartRouter = require("./routes/cart");
const notificationRouter = require("./routes/notification");
const payment = require('./routes/payment');
const categoriesRouter = require('./routes/categories');
const chatRouter = require('./routes/chatroute');
const commentsRouter = require('./routes/comments');
const reviewRouter = require('./routes/reviews');
const reviewMediaRouter = require('./routes/reviewMedia');

app.get("/", (req, res) => {
  res.send("Hello World!");
  console.log("Hello World!");
})

// Test endpoint to verify server is running
app.get("/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ success: true, message: "Server is running", timestamp: new Date().toISOString() });
})

// Test endpoint to check file serving
app.get("/test-files", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const uploadsDir = path.join(__dirname, 'uploads');
  const reviewMediaDir = path.join(uploadsDir, 'review-media');
  
  let files = [];
  
  try {
    if (fs.existsSync(reviewMediaDir)) {
      files = fs.readdirSync(reviewMediaDir);
    }
  } catch (error) {
    console.error('Error reading review-media directory:', error);
  }
  
  res.json({ 
    success: true, 
    uploadsDir,
    reviewMediaDir,
    files: files,
    fileCount: files.length
  });
})

// Register routes with base paths
app.use("/api/v1/auth", authRouter);
app.get("/api/v1/orders/success", handleSuccess);

app.get("/.well-known/acme-challenge/:id", (req, res) => {
  res.send("test")
})

// Define additional routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/shop", shopRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/notification", notificationRouter);
app.use('/api/v1/payment', payment);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/comments', commentsRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/review-media', reviewMediaRouter);

// Debug middleware to log all requests after routes
app.use((req, res, next) => {
  console.log('=== REQUEST AFTER ROUTES ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  next();
});

// 404 handler for debugging
app.use((req, res) => {
  console.log('=== 404 ROUTE NOT FOUND ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    method: req.method,
    url: req.url,
    availableRoutes: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/product',
      '/api/v1/shop',
      '/api/v1/orders',
      '/api/v1/cart',
      '/api/v1/notification',
      '/api/v1/payment',
      '/api/v1/categories',
      '/api/v1/chat',
      '/api/v1/comments'
    ]
  });
});

// Initialize WebSocket server
const socketServer = new SocketServer(server);

// Start the server and listen on the specified port
const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  console.log(`WebSocket server is ready`);
  seedData();
});

