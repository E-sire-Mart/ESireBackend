const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Test endpoint to verify router is working
router.get('/test', (req, res) => {
  console.log('Comments test endpoint hit');
  res.json({ success: true, message: 'Comments router is working' });
});

// Debug middleware to log all requests to comments router
router.use((req, res, next) => {
  console.log('=== COMMENTS ROUTER REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  next();
});

// Define schema inline to avoid separate model file overhead
const ReplySchema = new mongoose.Schema({
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  authorRole: { type: String, enum: ['user', 'vendor', 'admin'], required: true },
  authorName: { type: String },
  authorEmail: { type: String },
  createdAt: { type: Date, default: Date.now },
  attachments: { type: [String], default: [] }, // file paths
});

const CommentSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  content: { type: String, required: true },
  type: { type: String, enum: ['general', 'bug', 'feature', 'complaint', 'compliment'], default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  storeId: { type: String, index: true },
  fromUserId: { type: String, index: true },
  fromName: { type: String },
  fromEmail: { type: String },
  fromRole: { type: String, enum: ['user', 'vendor', 'admin'], required: true },
  toRole: { type: String, enum: ['vendor', 'admin'], required: true },
  isResolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  replies: { type: [ReplySchema], default: [] },
  attachments: { type: [String], default: [] }, // file paths
});

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

// Import CommentNotification model
const CommentNotification = mongoose.models.CommentNotification || require('../models/CommentNotification');
if (!CommentNotification) {
  // Define inline if model doesn't exist
  const CommentNotificationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['comment_reply', 'new_comment', 'comment_resolved', 'comment_deleted'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: String },
    relatedType: { type: String, enum: ['comment', 'reply'] },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  });
  mongoose.model('CommentNotification', CommentNotificationSchema);
}
const CommentNotificationModel = mongoose.models.CommentNotification;

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'comments');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// Create a comment (supports multipart with attachments[])
router.post('/', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const user = req.user || {};
    const {
      title = '', content, type = 'general', priority = 'medium', rating = 0,
      storeId, toRole,
    } = req.body || {};

    if (!content || !toRole) {
      return res.status(400).json({ success: false, message: 'content and toRole are required' });
    }

    // Determine fromRole from token if not provided
    const fromRole = req.body.fromRole || (user.is_owner ? 'vendor' : (user.isAdmin ? 'admin' : 'user'));

    const attachments = (req.files || []).map(f => path.posix.join('uploads/comments', path.basename(f.path)));
    const fromName = user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : (user.username || user.email || '');
    const fromEmail = user.email || '';

    const doc = await Comment.create({
      title,
      content,
      type,
      priority,
      rating,
      storeId: storeId || null,
      fromUserId: user._id || user.id || user.userId || null,
      fromRole,
      fromName,
      fromEmail,
      toRole,
      attachments,
    });

    // Create notification for store admins when a user posts a comment
    if (storeId && fromRole === 'user') {
      try {
        // Get store information to find store admins
        const Shop = mongoose.models.Shop || require('../models/Shop');
        const store = await Shop.findById(storeId).lean();
        if (store && store.owner_id) {
          await createNotification(
            store.owner_id,
            'new_comment',
            'New Comment on Your Store',
            `User ${fromName || fromEmail} posted a comment: "${title || content.substring(0, 50)}..."`,
            doc._id,
            'comment',
            {
              commentTitle: title,
              commentContent: content,
              commentType: type,
              commentPriority: priority,
              commentRating: rating,
              senderName: fromName,
              senderEmail: fromEmail,
              storeName: store.name || store.shop_name || 'Your Store'
            }
          );
        }
      } catch (notifErr) {
        console.error('Failed to create store notification:', notifErr);
      }
    }

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('Create comment error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Helper function to create notifications
async function createNotification(userId, type, title, message, relatedId, relatedType, metadata = {}) {
  try {
    if (CommentNotificationModel) {
      await CommentNotificationModel.create({
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        metadata
      });
    }
  } catch (err) {
    console.error('Create notification error:', err);
  }
}

// List comments with simple filters
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user || {};
    const { role, storeId, status, priority, type, q, fromUserId } = req.query;
    const query = {};

    if (role) query.toRole = role; // e.g., admin viewing toRole=admin (from vendors)
    if (storeId) query.storeId = storeId;
    if (status === 'resolved') query.isResolved = true;
    if (status === 'open') query.isResolved = false;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (fromUserId) query.fromUserId = fromUserId;
    if (q) query.$or = [
      { content: { $regex: q, $options: 'i' } },
      { title: { $regex: q, $options: 'i' } },
    ];

    // Role-aware defaults
    if (role === 'admin') {
      // Admins can see all comments addressed to admin
      if (user.isAdmin !== true && user.isAdmin !== 'true' && user.isAdmin !== 1 && user.role !== 'admin') {
        query.fromUserId = user._id || user.id || user.userId;
      }
    } else if (Object.keys(query).length === 0) {
      // If no specific filters are provided, default to only the authenticated user's comments
      query.fromUserId = user._id || user.id || user.userId;
    }
    
    // Enrich missing names/emails by looking up users collection when needed
    const docs = await Comment.find(query).sort({ createdAt: -1 }).limit(500).lean();
    try {
      const User = mongoose.models.User || require('../models/User');
      const missingCommentAuthors = docs.filter(d => (!d.fromName || !d.fromEmail || !d.fromAvatar) && d.fromUserId).map(d => d.fromUserId);
      const missingReplyAuthors = docs
        .flatMap(d => (Array.isArray(d.replies) ? d.replies : []))
        .filter(r => (!r.authorName || !r.authorEmail || !r.authorAvatar) && r.authorId)
        .map(r => r.authorId);
      const uniqueIds = [...new Set([...missingCommentAuthors, ...missingReplyAuthors])];
      if (uniqueIds.length) {
        const users = await User.find(
          { _id: { $in: uniqueIds } },
          { first_name: 1, last_name: 1, email: 1, username: 1, avatar: 1, photo: 1, image: 1, profileImage: 1, profilePic: 1, imageUrl: 1, avatarUrl: 1 }
        ).lean();
        const map = new Map(users.map(u => [String(u._id), u]));
        docs.forEach(d => {
          if ((!d.fromName || !d.fromEmail) && d.fromUserId) {
            const u = map.get(String(d.fromUserId));
            if (u) {
              if (!d.fromName) d.fromName = ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || u.username || u.email || '';
              if (!d.fromEmail) d.fromEmail = u.email || '';
              if (!d.fromAvatar) {
                d.fromAvatar = u.avatar || u.photo || u.image || u.profileImage || u.profilePic || u.imageUrl || u.avatarUrl || '';
              }
            }
          }
          if (Array.isArray(d.replies) && d.replies.length) {
            d.replies = d.replies.map(r => {
              if ((!r.authorName || !r.authorEmail || !r.authorAvatar) && r.authorId) {
                const ru = map.get(String(r.authorId));
                if (ru) {
                  return {
                    ...r,
                    authorName: r.authorName || (((ru.first_name || '') + ' ' + (ru.last_name || '')).trim() || ru.username || ru.email || ''),
                    authorEmail: r.authorEmail || (ru.email || ''),
                    authorAvatar: r.authorAvatar || (ru.avatar || ru.photo || ru.image || ru.profileImage || ru.profilePic || ru.imageUrl || ru.avatarUrl || ''),
                  };
                }
              }
              return r;
            });
          }
        });
      }
    } catch (_) {}
    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error('List comments error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Reply to a comment (supports attachments[])
router.post('/:id/replies', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const user = req.user || {};
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ success: false, message: 'content is required' });

    const authorRole = user.isAdmin ? 'admin' : (user.is_owner ? 'vendor' : 'user');
    const reply = {
      content,
      authorId: user._id || user.id || user.userId || 'unknown',
      authorRole,
      authorName: (user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : (user.username || user.email || '')),
      authorEmail: user.email || '',
      createdAt: new Date(),
      attachments: (req.files || []).map(f => path.posix.join('uploads/comments', path.basename(f.path))),
    };

    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      { $push: { replies: reply } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Create notification for the comment author when someone replies
    if (updated.fromUserId && updated.fromUserId !== user._id) {
      try {
        const replyAuthorName = reply.authorName || (user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : (user.username || user.email || ''));
        const replyAuthorRole = reply.authorRole === 'vendor' ? 'Store Admin' : reply.authorRole === 'admin' ? 'Administrator' : 'User';
        
        await createNotification(
          updated.fromUserId,
          'comment_reply',
          'New Reply to Your Comment',
          `${replyAuthorRole} ${replyAuthorName} replied to your comment: "${content.substring(0, 50)}..."`,
          reply._id || updated._id,
          'reply',
          {
            replyContent: content,
            replyAuthorName: replyAuthorName,
            replyAuthorRole: reply.authorRole,
            replyAuthorEmail: reply.authorEmail,
            originalCommentTitle: updated.title,
            originalCommentContent: updated.content,
            storeName: updated.storeId ? 'Store' : 'System'
          }
        );
      } catch (notifErr) {
        console.error('Failed to create reply notification:', notifErr);
      }
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Reply error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Resolve a comment
router.patch('/:id/resolve', authenticate, async (req, res) => {
  console.log('=== RESOLVE ENDPOINT HIT ===');
  try {
    console.log('Resolve endpoint hit:', { 
      method: req.method, 
      url: req.url, 
      params: req.params,
      headers: req.headers,
      user: req.user 
    });
    
    const user = req.user || {};
    console.log('Resolve comment request:', { commentId: req.params.id, userId: user._id || user.id || user.userId });
    
    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      { $set: { isResolved: true } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Comment not found' });
    
    console.log('Comment resolved successfully:', { commentId: updated._id, isResolved: updated.isResolved });

    // Create notification for the comment author when comment is resolved
    if (updated.fromUserId && updated.fromUserId !== (user._id || user.id || user.userId)) {
      try {
        console.log('Creating resolve notification for user:', updated.fromUserId);
        console.log('CommentNotificationModel exists:', !!CommentNotificationModel);
        console.log('Available models:', Object.keys(mongoose.models));
        
        const resolverName = user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : (user.username || user.email || '');
        const resolverRole = user.isAdmin ? 'Administrator' : (user.is_owner ? 'Store Admin' : 'User');
        
        console.log('Notification details:', { resolverName, resolverRole, commentId: updated._id });
        
        await createNotification(
          updated.fromUserId,
          'comment_resolved',
          'Your Comment Has Been Resolved',
          `${resolverRole} ${resolverName} marked your comment as resolved`,
          updated._id,
          'comment',
          {
            commentTitle: updated.title,
            commentContent: updated.content,
            resolverName: resolverName,
            resolverRole: resolverRole,
            storeName: updated.storeId ? 'Store' : 'System'
          }
        );
        console.log('Resolve notification created successfully');
      } catch (notifErr) {
        console.error('Failed to create resolve notification:', notifErr);
        console.error('Notification error details:', { 
          message: notifErr.message, 
          stack: notifErr.stack 
        });
      }
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Resolve error:', err);
    console.error('Error details:', { 
      message: err.message, 
      stack: err.stack,
      commentId: req.params.id,
      userId: user._id || user.id || user.userId 
    });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update a comment
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user || {};
    const { title, content, type, priority, rating } = req.body || {};
    
    // Find the comment first to check permissions
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check permissions: users can only update their own comments
    const canUpdate = 
      // User can update their own comment
      (comment.fromUserId === (user._id || user.id || user.userId)) ||
      // Admin can update any comment
      user.isAdmin;

    if (!canUpdate) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this comment' });
    }

    // Only allow updates to unresolved comments
    if (comment.isResolved) {
      return res.status(400).json({ success: false, message: 'Cannot update resolved comments' });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (rating !== undefined) updateData.rating = rating;

    // Update the comment
    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    console.log('Comment updated successfully:', { commentId: updated._id, updatedBy: user._id || user.id || user.userId });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update comment error:', err);
    console.error('Error details:', { 
      message: err.message, 
      stack: err.stack,
      commentId: req.params.id,
      userId: user._id || user.id || user.userId 
    });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete a comment
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user || {};
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Debug logging
    console.log('Delete permission check:', {
      commentId: req.params.id,
      userId: user._id || user.id || user.userId,
      userIsOwner: user.is_owner,
      userIsAdmin: user.isAdmin,
      userRole: user.role,
      userEmail: user.email,
      fullUserObject: JSON.stringify(user, null, 2),
      commentFromUserId: comment.fromUserId,
      commentIsResolved: comment.isResolved,
      commentStoreId: comment.storeId
    });

    // Normalize role flags that may arrive as strings from JWT
    const isOwner = user.is_owner === true || user.is_owner === 'true' || user.is_owner === 1 || user.role === 'vendor';
    const isAdmin = user.isAdmin === true || user.isAdmin === 'true' || user.isAdmin === 1 || user.role === 'admin';

    // If vendor, verify ownership of the store when possible
    let vendorOwnsCommentStore = false;
    if (isOwner && comment.storeId) {
      try {
        const Shop = mongoose.models.Shop || require('../models/Shop');
        const ownerId = String(user._id || user.id || user.userId || '');
        // Shop model uses `owner` field
        const shops = await Shop.find({ owner: ownerId }).select({ _id: 1 }).lean();
        const shopIds = (shops || []).map(s => String(s._id));
        vendorOwnsCommentStore = shopIds.includes(String(comment.storeId));
        console.log('Vendor shop ownership check:', { ownerId, commentStoreId: String(comment.storeId), vendorOwnsCommentStore, shopIds });
      } catch (e) {
        console.warn('Shop ownership check failed:', e.message);
      }
    }

    // Check permissions: users can delete own comments; vendors can delete resolved comments for their store; admins can delete all
    const canDelete = 
      (comment.fromUserId === (user._id || user.id || user.userId)) ||
      (isOwner && comment.isResolved && (vendorOwnsCommentStore || !comment.storeId)) ||
      isAdmin;

    console.log('Permission check result:', {
      canDelete,
      isOwnComment: comment.fromUserId === (user._id || user.id || user.userId),
      isShopAdminResolved: isOwner && comment.isResolved,
      isAdmin
    });

    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this comment' });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);

    // Create notification for the comment author if deleted by someone else
    if (comment.fromUserId && comment.fromUserId !== (user._id || user.id || user.userId)) {
      try {
        const deleterName = user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : (user.username || user.email || '');
        const deleterRole = user.isAdmin ? 'Administrator' : (user.is_owner ? 'Store Admin' : 'User');
        
        await createNotification(
          comment.fromUserId,
          'comment_deleted',
          'Your Comment Has Been Deleted',
          `${deleterRole} ${deleterName} deleted your comment`,
          comment._id,
          'comment',
          {
            commentTitle: comment.title,
            commentContent: comment.content,
            deleterName: deleterName,
            deleterRole: deleterRole
          }
        );
      } catch (notifErr) {
        console.error('Failed to create delete notification:', notifErr);
      }
    }

    return res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


