const express = require("express");
const router = express.Router();
const chatcontroller = require("../controllers/chatcontroller");
const { authenticate } = require("../middleware/auth");


router.get("/", authenticate, chatcontroller.getAllUsers);
router.post("/online", authenticate, chatcontroller.updateOnlineStatus);

// Chat room routes
router.get("/rooms", authenticate, chatcontroller.getUserChatRooms);
router.post("/rooms", authenticate, chatcontroller.createOrGetChatRoom);
router.get("/rooms/:roomId/messages", authenticate, chatcontroller.getRoomMessages);
router.post("/rooms/:roomId/messages", authenticate, chatcontroller.createMessage);

module.exports = router;