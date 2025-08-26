// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Import custom modules and middleware
const { authenticate } = require("./middleware/auth");
const { handleStripeWebhook, handleSuccess } = require("./controllers/orderController");
const connectDB = require("./db/connection");

// Initialize Express app
const app = express();

// Create an HTTP server with Express
const server = http.createServer(app);

// Create a Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: [
      "https://e-siremart.com",
      "https://www.e-siremart.com",
      "https://api.e-siremart.com",
      process.env.FRONTEND_URL,
      process.env.VENDOR_URL,
      process.env.ADMIN_URL
    ].filter(Boolean),
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware options for CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://e-siremart.com",
      "https://www.e-siremart.com",
      "https://api.e-siremart.com",
      process.env.FRONTEND_URL,
      process.env.VENDOR_URL,
      process.env.ADMIN_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Configure middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ type: "application/vnd.api+json", strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// API Version 1 Routes
const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const productRouter = require("./routes/products");
const shopRouter = require("./routes/shops");
const orderRouter = require("./routes/order");
const cartRouter = require("./routes/cart");
const notificationRouter = require("./routes/notification");
const paymentRouter = require('./routes/payment');

// API v1 Routes - All user, vendor, and admin APIs
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/shop", shopRouter);
app.use("/api/v1/admin", userRouter); // Admin uses same user routes but with admin middleware
app.use("/api/v1/product", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/notification", notificationRouter);
app.use('/api/v1/payment', paymentRouter);

// Stripe webhook endpoint
app.post(
  "/api/v1/orders/webhook-checkout",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Stripe success callback
app.get("/api/v1/orders/success", handleSuccess);

// SSL Certificate verification (for Let's Encrypt)
app.get("/.well-known/acme-challenge/:id", (req, res) => {
    res.send("acme-challenge-response");
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "E-SireMart API Server",
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      shop: "/api/v1/shop",
      admin: "/api/v1/admin",
      products: "/api/v1/product",
      orders: "/api/v1/orders",
      cart: "/api/v1/cart",
      notifications: "/api/v1/notification",
      payments: "/api/v1/payment"
    },
    documentation: "https://e-siremart.com/api/docs"
  });
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    method: req.method
  });
});

// Socket.IO setup for real-time features
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join user to their specific room (user, vendor, or admin)
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // Handle custom "message" event
  socket.on("message", (data) => {
    console.log(`Message received: ${data}`);
    socket.emit("messageResponse", `Server received your message: ${data}`);
  });

  // Handle order updates
  socket.on("order-update", (data) => {
    // Broadcast to relevant rooms
    socket.to(`user-${data.userId}`).emit("order-status-changed", data);
    socket.to(`vendor-${data.shopId}`).emit("new-order", data);
    socket.to("admin").emit("order-update", data);
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start the server
const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`🚀 E-SireMart API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
});

module.exports = { app, server, io };
