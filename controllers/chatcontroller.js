const User = require("../models/User");
const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
// const { validationResult } = require("express-validator");
// const bcrypt = require("bcryptjs");
// const Shop = require("../models/Shop");
// const { json } = require("body-parser");
// const path = require("path");
// const fs = require("fs");

// const getUsersCounts = async (req, res) => {
//   try {
//     try {
//       const counts = await User.countDocuments();
//       return res.status(201).json({ counts });
//     } catch (validationError) {
//       console.log(validationError);
//       let message = "Validation error";
//       for (let key in validationError.errors) {
//         message = validationError.errors[key].message;
//       }
//       return res.status(400).json({ message });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;

    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
      ];
    }

    // Get current user ID from authenticated request
    const currentUserId = req.user.userId;
    
    // Add filter to exclude current user
    if (currentUserId) {
      query._id = { $ne: currentUserId };
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

// Update user online status
const updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    
    // Debug: Log the request user object
    console.log('Request user object:', req.user);
    console.log('Request body:', req.body);
    
    // Get user ID from authenticated user - the token contains 'userId'
    const userId = req.user.userId;

    if (!userId) {
      console.error('User ID not found in token. Available fields:', Object.keys(req.user));
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required. Available fields: " + Object.keys(req.user).join(', ')
      });
    }

    console.log('Using user ID:', userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline: isOnline },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      message: `User ${isOnline ? 'online' : 'offline'} status updated`,
      data: { userId, isOnline }
    });
  } catch (error) {
    console.error('Error updating online status:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: error.message 
    });
  }
};

// Get user's chat rooms
const getUserChatRooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const rooms = await ChatRoom.find({
      'participants.userId': userId,
      isActive: true
    }).populate('participants.userId', 'username first_name last_name avatar isOnline');

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// Get messages for a room
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    console.log('getRoomMessages called for room:', roomId, 'by user:', userId);

    // Check if user is participant in this room
    const room = await ChatRoom.findOne({
      roomId,
      'participants.userId': userId
    });

    if (!room) {
      console.log('User not found in room participants. Room:', roomId, 'User:', userId);
      
      // Check if this is a room between two users (customer and admin/shop admin)
      // The roomId format is userId1_userId2, so we can extract the participants
      const participantIds = roomId.split('_');
      if (participantIds.length === 2) {
        const [userId1, userId2] = participantIds;
        
        // Check if the requesting user is one of the participants
        if (userId === userId1 || userId === userId2) {
          console.log('User is a participant based on room ID. Creating room access.');
          
          // Create or update the room to include this user as a participant
          const user = await User.findById(userId);
          if (user) {
            let existingRoom = await ChatRoom.findOne({ roomId });
            
            if (!existingRoom) {
              // Create new room
              const otherUserId = userId === userId1 ? userId2 : userId1;
              const otherUser = await User.findById(otherUserId);
              
              existingRoom = new ChatRoom({
                roomId,
                participants: [
                  {
                    userId: userId,
                    username: user.username || user.first_name || 'User',
                    isOnline: false,
                    lastSeen: new Date()
                  },
                  {
                    userId: otherUserId,
                    username: otherUser ? (otherUser.username || otherUser.first_name || 'User') : 'Unknown User',
                    isOnline: false,
                    lastSeen: new Date()
                  }
                ],
                unreadCount: new Map([[userId, 0], [otherUserId, 0]])
              });
              await existingRoom.save();
              console.log('Created new room for user access:', existingRoom);
            } else {
              // Add user to existing room if not already there
              const isParticipant = existingRoom.participants.some(p => p.userId === userId);
              if (!isParticipant) {
                existingRoom.participants.push({
                  userId: userId,
                  username: user.username || user.first_name || 'User',
                  isOnline: false,
                  lastSeen: new Date()
                });
                existingRoom.unreadCount.set(userId, 0);
                await existingRoom.save();
                console.log('Added user to existing room:', existingRoom);
              }
            }
          }
        } else {
          console.log('User is not a participant in this room');
          return res.status(403).json({
            success: false,
            message: "Access denied to this chat room"
          });
        }
      } else {
        console.log('Invalid room ID format:', roomId);
        return res.status(400).json({
          success: false,
          message: "Invalid room ID format"
        });
      }
    }

    const result = await Message.getRoomMessages(roomId, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// Create or get chat room
const createOrGetChatRoom = async (req, res) => {
  try {
    const { contactId, contactName } = req.body;
    const userId = req.user.userId;

    // Get current user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Find or create chat room
    const room = await ChatRoom.findOrCreateRoom(
      userId,
      contactId,
      user.username || user.first_name || 'User',
      contactName
    );

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error creating/getting chat room:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

// Create a new message
const createMessage = async (req, res) => {
  try {
    console.log('createMessage called with:', {
      params: req.params,
      body: req.body,
      userId: req.user.userId
    });
    
    const { roomId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const userId = req.user.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required"
      });
    }

    // Check if user is participant in this room
    const room = await ChatRoom.findOne({
      roomId,
      'participants.userId': userId
    });

    if (!room) {
      console.log('User not found in room participants for message creation. Room:', roomId, 'User:', userId);
      
      // Check if this is a room between two users (customer and admin/shop admin)
      const participantIds = roomId.split('_');
      if (participantIds.length === 2) {
        const [userId1, userId2] = participantIds;
        
        // Check if the requesting user is one of the participants
        if (userId === userId1 || userId === userId2) {
          console.log('User is a participant based on room ID. Creating room access for message.');
          
          // Create or update the room to include this user as a participant
          const user = await User.findById(userId);
          if (user) {
            let existingRoom = await ChatRoom.findOne({ roomId });
            
            if (!existingRoom) {
              // Create new room
              const otherUserId = userId === userId1 ? userId2 : userId1;
              const otherUser = await User.findById(otherUserId);
              
              existingRoom = new ChatRoom({
                roomId,
                participants: [
                  {
                    userId: userId,
                    username: user.username || user.first_name || 'User',
                    isOnline: false,
                    lastSeen: new Date()
                  },
                  {
                    userId: otherUserId,
                    username: otherUser ? (otherUser.username || otherUser.first_name || 'User') : 'Unknown User',
                    isOnline: false,
                    lastSeen: new Date()
                  }
                ],
                unreadCount: new Map([[userId, 0], [otherUserId, 0]])
              });
              await existingRoom.save();
              console.log('Created new room for message creation:', existingRoom);
            } else {
              // Add user to existing room if not already there
              const isParticipant = existingRoom.participants.some(p => p.userId === userId);
              if (!isParticipant) {
                existingRoom.participants.push({
                  userId: userId,
                  username: user.username || user.first_name || 'User',
                  isOnline: false,
                  lastSeen: new Date()
                });
                existingRoom.unreadCount.set(userId, 0);
                await existingRoom.save();
                console.log('Added user to existing room for message creation:', existingRoom);
              }
            }
          }
        } else {
          console.log('User is not a participant in this room for message creation');
          return res.status(403).json({
            success: false,
            message: "Access denied to this chat room"
          });
        }
      } else {
        console.log('Invalid room ID format for message creation:', roomId);
        return res.status(400).json({
          success: false,
          message: "Invalid room ID format"
        });
      }
    }

    // Get user info for sender name
    const user = await User.findById(userId);
    const senderName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : 'Unknown User';

    // Create new message
    const message = new Message({
      roomId,
      senderId: userId,
      senderName,
      content: content.trim(),
      messageType,
      status: 'sent',
      readBy: [userId] // Sender has read the message
    });

    await message.save();

    // Update room's last message
    await ChatRoom.findByIdAndUpdate(room._id, {
      lastMessage: content.trim(),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: "Message created successfully",
      data: {
        message: {
          id: message._id,
          roomId: message.roomId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          messageType: message.messageType,
          status: message.status,
          timestamp: message.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  updateOnlineStatus,
  getUserChatRooms,
  getRoomMessages,
  createOrGetChatRoom,
  createMessage
};