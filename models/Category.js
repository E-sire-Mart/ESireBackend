const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  image: {
    type: String,
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: 160
  },
  metaKeywords: {
    type: String,
    trim: true,
    maxlength: 200
  },
  level: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for children
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

// Index for better query performance
categorySchema.index({ parentId: 1, sortOrder: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

// Pre-save middleware to calculate level
categorySchema.pre('save', async function(next) {
  if (this.parentId) {
    const parent = await this.constructor.findById(this.parentId);
    this.level = parent ? parent.level + 1 : 0;
  } else {
    this.level = 0;
  }
  next();
});

// Static method to get categories as tree
categorySchema.statics.getTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  
  return this.buildTree(categories);
};

// Static method to build tree structure
categorySchema.statics.buildTree = function(categories, parentId = null) {
  const tree = [];
  
  for (const category of categories) {
    if (category.parentId?.toString() === parentId?.toString()) {
      const children = this.buildTree(categories, category._id.toString());
      if (children.length > 0) {
        category.children = children;
      }
      tree.push(category);
    }
  }
  
  return tree;
};

// Static method to get root categories
categorySchema.statics.getRootCategories = function() {
  return this.find({ parentId: null, isActive: true })
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to get categories by parent
categorySchema.statics.getByParent = function(parentId) {
  return this.find({ parentId, isActive: true })
    .sort({ sortOrder: 1, name: 1 });
};

// Method to check if category has children
categorySchema.methods.hasChildren = async function() {
  const count = await this.constructor.countDocuments({ parentId: this._id, isActive: true });
  return count > 0;
};

// Method to check if category can be deleted
categorySchema.methods.canDelete = async function() {
  const hasChildren = await this.hasChildren();
  return !hasChildren;
};

module.exports = mongoose.model('Category', categorySchema);
