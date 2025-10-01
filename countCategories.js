// Load environment variables
require("dotenv").config();

// Import database connection and Category model
const connectDB = require("./db/connection");
const Category = require("./models/Category");

const countCategories = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Count all categories
    const categoryCount = await Category.countDocuments();
    
    // Get all categories with basic info
    const categories = await Category.find({}, 'name slug isActive sortOrder');
    
    console.log(`\n📊 CATEGORY COUNT REPORT`);
    console.log(`========================`);
    console.log(`Total categories in database: ${categoryCount}`);
    console.log(`\n📋 Category List:`);
    console.log(`=================`);
    
    if (categories.length === 0) {
      console.log('No categories found in database.');
    } else {
      categories.forEach((category, index) => {
        const status = category.isActive ? '✅ Active' : '❌ Inactive';
        console.log(`${index + 1}. ${category.name} (${category.slug}) - ${status} - Order: ${category.sortOrder}`);
      });
    }
    
    console.log(`\n✨ Report completed!`);
    
  } catch (error) {
    console.error('❌ Error counting categories:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
};

// Run the count function
countCategories();
