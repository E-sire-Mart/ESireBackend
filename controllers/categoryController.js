const Category = require('../models/Category');

// Get all categories as tree structure
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.getTree();
    
    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      message: 'Internal server error'
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required',
        message: 'Please provide a valid category ID'
      });
    }

    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The requested category does not exist'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category',
      message: 'Internal server error'
    });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      parentId,
      isActive = true,
      sortOrder = 0,
      metaTitle,
      metaDescription,
      metaKeywords
    } = req.body;

    console.log('Create category request:', { 
      name, slug, description, parentId, isActive, sortOrder, 
      metaTitle, metaDescription, metaKeywords, file: req.file 
    });

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Name and slug are required',
        message: 'Please provide both name and slug for the category'
      });
    }

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Slug already exists',
        message: 'A category with this slug already exists'
      });
    }

    // Handle parentId - convert empty string to null
    const normalizedParentId = parentId && parentId.trim() !== '' ? parentId : null;

    // Validate parent category if provided
    if (normalizedParentId) {
      const parentCategory = await Category.findById(normalizedParentId);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parent category',
          message: 'The specified parent category does not exist'
        });
      }
    }

    // Handle image upload - only for root categories
    let image = null;
    if (req.file) {
      if (normalizedParentId) {
        return res.status(400).json({
          success: false,
          error: 'Image upload not allowed',
          message: 'Images can only be uploaded for root-level categories. Sub-categories cannot have images.'
        });
      }
      console.log('File uploaded:', req.file);
      // Store only the filename (without the 'uploads/' prefix or OS-specific path)
      image = req.file.filename;
    }

    const category = new Category({
      name,
      slug,
      description,
      image,
      parentId: normalizedParentId,
      isActive,
      sortOrder,
      metaTitle,
      metaDescription,
      metaKeywords
    });

    console.log('Saving category:', category);

    await category.save();

    console.log('Category created successfully:', category);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to create category',
      message: error.message || 'Internal server error'
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('Update category request:', { id, updateData, file: req.file });

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required',
        message: 'Please provide a valid category ID'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The requested category does not exist'
      });
    }

    // Handle parentId - convert empty string to null
    if (updateData.parentId !== undefined) {
      updateData.parentId = updateData.parentId && updateData.parentId.trim() !== '' ? updateData.parentId : null;
      
      // If category is becoming a sub-category, remove any existing image
      if (updateData.parentId !== null && category.image) {
        updateData.image = null;
        console.log('Removing image from category as it is becoming a sub-category');
      }
    }

    // Validate parent category if being updated
    if (updateData.parentId !== undefined && updateData.parentId !== category.parentId?.toString()) {
      // Prevent setting parent to itself
      if (updateData.parentId === id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parent category',
          message: 'A category cannot be its own parent'
        });
      }

      // Check if new parent exists
      if (updateData.parentId !== null) {
        const parentCategory = await Category.findById(updateData.parentId);
        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            error: 'Invalid parent category',
            message: 'The specified parent category does not exist'
          });
        }
      }
    }

    // Handle image upload
    if (req.file) {
      // Check if this is a sub-category trying to upload an image
      if (updateData.parentId !== undefined && updateData.parentId !== null) {
        return res.status(400).json({
          success: false,
          error: 'Image upload not allowed',
          message: 'Images can only be uploaded for root-level categories. Sub-categories cannot have images.'
        });
      }
      
      // Check if existing category is a sub-category
      if (category.parentId) {
        return res.status(400).json({
          success: false,
          error: 'Image upload not allowed',
          message: 'Images can only be uploaded for root-level categories. Sub-categories cannot have images.'
        });
      }
      
      console.log('File uploaded:', req.file);
      // Store only the filename (not full path)
      updateData.image = req.file.filename;
    }

    console.log('Final update data:', updateData);

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Category updated successfully:', updatedCategory);

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to update category',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required',
        message: 'Please provide a valid category ID'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The requested category does not exist'
      });
    }

    // Check if category can be deleted
    const canDelete = await category.canDelete();
    if (!canDelete) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category',
        message: 'Cannot delete a category that has child categories'
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category',
      message: 'Internal server error'
    });
  }
};

// Get root categories
exports.getRootCategories = async (req, res) => {
  try {
    const categories = await Category.getRootCategories();
    
    res.json({
      success: true,
      data: categories,
      message: 'Root categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting root categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve root categories',
      message: 'Internal server error'
    });
  }
};

// Get categories by parent
exports.getCategoriesByParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    let categories;
    if (parentId === 'root') {
      categories = await Category.getRootCategories();
    } else {
      categories = await Category.getByParent(parentId);
    }

    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting categories by parent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      message: 'Internal server error'
    });
  }
};

// Move category to different parent
exports.moveCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required',
        message: 'Please provide a valid category ID'
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'The requested category does not exist'
      });
    }

    // Handle parentId - convert empty string to null
    const normalizedParentId = parentId && parentId.trim() !== '' && parentId !== 'null' ? parentId : null;

    // Prevent moving to itself
    if (normalizedParentId === id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parent category',
        message: 'A category cannot be its own parent'
      });
    }

    // Validate new parent if provided
    if (normalizedParentId) {
      const parentCategory = await Category.findById(normalizedParentId);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parent category',
          message: 'The specified parent category does not exist'
        });
      }
    }

    // Update the category
    category.parentId = normalizedParentId;
    await category.save();

    res.json({
      success: true,
      data: category,
      message: 'Category moved successfully'
    });
  } catch (error) {
    console.error('Error moving category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move category',
      message: 'Internal server error'
    });
  }
};

// Reorder categories
exports.reorderCategories = async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category IDs',
        message: 'Please provide an array of category IDs'
      });
    }

    // Update sort order for each category
    const updatePromises = categoryIds.map((categoryId, index) => {
      return Category.findByIdAndUpdate(categoryId, { sortOrder: index });
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder categories',
      message: 'Internal server error'
    });
  }
};
