const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [{
    userId: String,
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Mark message as read
messageSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.find(r => r.userId === userId)) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
    this.status = 'read';
    await this.save();
  }
};

// Get messages for a room with pagination
messageSchema.statics.getRoomMessages = async function(roomId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({ roomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments({ roomId });
  
  return {
    messages: messages.reverse(), // Return in chronological order
    total,
    page,
    limit,
    hasMore: skip + limit < total
  };
};

// Get unread message count for a user in a room
messageSchema.statics.getUnreadCount = async function(roomId, userId) {
  return await this.countDocuments({
    roomId,
    senderId: { $ne: userId },
    readBy: { $not: { $elemMatch: { userId } } }
  });
};

module.exports = mongoose.model('Message', messageSchema);
