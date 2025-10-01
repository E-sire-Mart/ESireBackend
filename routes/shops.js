// routes/shops.js
const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");

const multer = require("multer");

const { authenticate } = require("../middleware/auth");

// Define storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define routes
// Accept JSON payloads from the admin app; no multipart parser is required here
router.post("/", shopController.createShopByAdmin);
router.post("/create", shopController.createShop);
// router.post("/admin/shop", upload.none(), shopController.createShopByAdmin);
router.get("/", authenticate, shopController.getShopById);
router.get("/all", shopController.getAllShop);
router.get("/list-basic", shopController.getShopsBasic);
router.get("/admin", authenticate, shopController.getAllShopsForAdmin);
router.put("/", authenticate, upload.none(), shopController.updateShopById);
router.delete("/:id", shopController.deleteShopById);
router.patch("/:id/approve", shopController.approveShop);
router.get("/counts", shopController.shopsCounts);
module.exports = router;
