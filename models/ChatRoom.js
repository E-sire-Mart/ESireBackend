const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  participants: [{
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    content: String,
    senderId: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
chatRoomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create roomId from participant IDs
chatRoomSchema.statics.createRoomId = function(userId1, userId2) {
  return [userId1, userId2].sort().join('_');
};

// Find or create chat room
chatRoomSchema.statics.findOrCreateRoom = async function(userId1, userId2, username1, username2) {
  const roomId = this.createRoomId(userId1, userId2);
  
  let room = await this.findOne({ roomId });
  
  if (!room) {
    room = new this({
      roomId,
      participants: [
        {
          userId: userId1,
          username: username1,
          isOnline: false,
          lastSeen: new Date()
        },
        {
          userId: userId2,
          username: username2,
          isOnline: false,
          lastSeen: new Date()
        }
      ],
      unreadCount: new Map([[userId1, 0], [userId2, 0]])
    });
    await room.save();
  }
  
  return room;
};

// Update participant online status
chatRoomSchema.methods.updateParticipantStatus = async function(userId, isOnline) {
  const participant = this.participants.find(p => p.userId === userId);
  if (participant) {
    participant.isOnline = isOnline;
    participant.lastSeen = new Date();
    await this.save();
  }
};

// Add message to room
chatRoomSchema.methods.addMessage = async function(content, senderId) {
  this.lastMessage = {
    content,
    senderId,
    timestamp: new Date()
  };
  
  // Increment unread count for other participants
  this.participants.forEach(participant => {
    if (participant.userId !== senderId) {
      const currentCount = this.unreadCount.get(participant.userId) || 0;
      this.unreadCount.set(participant.userId, currentCount + 1);
    }
  });
  
  await this.save();
};

// Mark messages as read for a user
chatRoomSchema.methods.markAsRead = async function(userId) {
  this.unreadCount.set(userId, 0);
  await this.save();
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
