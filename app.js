// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
// const path = require("path");

// Import custom modules and middleware
const { authenticate } = require("./middleware/auth");
const { handleStripeWebhook, handleSuccess } = require("./controllers/orderController");
const connectDB = require("./db/connection");

// Initialize Express app
const app = express();
app.use('/uploads', express.static('uploads'))
// Create an HTTP server with Express
const server = http.createServer(app);

// Create a Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Connect to MongoDB

// Middleware options for CORS
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
};

connectDB();



// Configure middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ type: "application/vnd.api+json", strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// API Version 1 Routes
const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const productRouter = require("./routes/products");
const shopRouter = require("./routes/shops");
const orderRouter = require("./routes/order");
const cartRouter = require("./routes/cart");
const notificationRouter = require("./routes/notification");
const paymentRouter = require('./routes/payment');


app.get("/", (req, res) => {
  res.send("Hello World!");
})

app.get("api/v1/orders/success", handleSuccess);
app.get("./well-known/acme-challenge/:id", (req, res) => {
  res.send("test");
})

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


// Socket.IO setup for real-time features
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);


  // Handle custom "message" event
  socket.on("message", (data) => {
    console.log(`Message received: ${data}`);
    socket.emit("messageResponse", `Server received your message: ${data}`);
  });


  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});



// Start the server
const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`E-SireMart API Server running on port ${PORT}`);
});

