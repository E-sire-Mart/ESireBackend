const { seedCategories } = require('./seedCategories');
const { seedSubcategories } = require('./seedSubcategories');
const { seedProducts } = require('./seedProducts');

const seedData = async () => {
  try {
    console.log('Starting to seed data...');
    
    // Seed categories
    await seedCategories();
    
    // Seed subcategories
    await seedSubcategories();
    
    // Seed products
    await seedProducts(100);
    
    console.log('Seed data completed successfully!');
  } catch (error) {
    console.error('Seed data error:', error);
  }
};

module.exports = { seedData };