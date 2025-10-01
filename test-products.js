const mongoose = require('mongoose');
require('dotenv').config();

const { seedProducts } = require('./utils/seedProducts');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bellybasket';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected to MongoDB');

  try {
    await seedProducts(100);
    console.log('✅ Product seeding completed');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();


