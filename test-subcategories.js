const mongoose = require('mongoose');
const { seedSubcategories } = require('./utils/seedSubcategories');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bellybasket', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  return seedSubcategories();
})
.then(() => {
  console.log('✅ Subcategories seeding completed');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
