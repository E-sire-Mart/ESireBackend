const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Define notification schema inline
const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['comment_reply', 'new_comment', 'comment_resolved'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: String }, // comment ID or reply ID
  relatedType: { type: String, enum: ['comment', 'reply'] },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} } // store additional info like sender name, store name, etc.
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// Get user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user || {};
    const { unreadOnly, limit = 50 } = req.query;
    
    const query = { userId: user._id || user.id || user.userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    return res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const user = req.user || {};
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: user._id || user.id || user.userId },
      { $set: { isRead: true } },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    return res.json({ success: true, data: notification });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    const user = req.user || {};
    const result = await Notification.updateMany(
      { userId: user._id || user.id || user.userId, isRead: false },
      { $set: { isRead: true } }
    );
    
    return res.json({ success: true, data: { updatedCount: result.modifiedCount } });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const user = req.user || {};
    const count = await Notification.countDocuments({
      userId: user._id || user.id || user.userId,
      isRead: false
    });
    
    return res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('Get unread count error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
