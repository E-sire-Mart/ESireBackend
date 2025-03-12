import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
// import morgan from "morgan";
import helmet from "helmet";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import http from 'http';
import connectDB from "./config/connectDB.js";
import userRouter from "./route/user.route.js";
import categoryRouter from "./route/category.route.js";
import uploadRouter from "./route/upload.router.js";
import subCategoryRouter from "./route/subCategory.route.js";
import productRouter from "./route/product.route.js";
import cartRouter from "./route/cart.route.js";
import addressRouter from "./route/address.route.js";
import orderRouter from "./route/order.route.js";

const app = express();

const server = http.createServer(app);

// const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:3000"]
const corsOptions = {

  origin: function (origin, callback) {

      callback(null, true); // Allow requests from all origins

  },

  credentials: true, // Allow credentials (cookies, HTTP authentication)
  // methods: ["GET", "POST", "PUT", "DELETE"],
};


app.use(cors(corsOptions)); // Enable CORS with options
app.use(bodyParser.json({ type: "application/vnd.api+json", strict: false })); // Parse JSON bodies with specific MIME type
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
// app.use(morgan("dev"));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);


const io = new Server(server, {
  cors: {
    origin: "*",
  }
})

// socket.io setup
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("message", (data) => {
    console.log(`Message received: ${data}`)
  })
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  })
})

app.use("/api/user", userRouter);
app.use("/api/category", categoryRouter);
app.use("/api/file", uploadRouter);
app.use("/api/subcategory", subCategoryRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);


app.get("/", (request, response) => {
  ///server to client
  response.json({
    message: "Server is running " + PORT,
  });
});

// app.use((error, req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "https://e-sirefront-end-web.vercel.app");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.header("Access-Control-Allow-Credentials", "true");
//   next();
//   console.log("Error: ", error.message);
//   res.status(500).json({error: error.message})
// });


const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running", PORT);
  });
});
