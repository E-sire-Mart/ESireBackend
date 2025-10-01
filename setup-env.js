const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Categories API Environment...\n');

// Check if .env file already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Skipping creation.');
  console.log('   If you need to update it, please edit it manually.\n');
} else {
  // Create .env file with default values
  const envContent = `# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/bellybasket

# Server Configuration
PORT=3003
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration (optional for now)
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password

# API URLs
SERVER_URL=http://localhost:3003/
CLIENT_URL=http://localhost:8003/
ADMIN_URL=http://localhost:8003/
VENDER_URL=http://localhost:4000/
VENDOR_DASHBOARD_URL=http://localhost:4000/

# Payment Gateway Keys (optional for now)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
RAZOR_PAY_KEY_SECRET=your-razorpay-secret
RAZOR_PAY_KEY_ID=your-razorpay-key-id

# Email Service Keys (optional for now)
BREVO_API_KEY=your-brevo-api-key
MAILERSEND_API_KEY=your-mailersend-api-key
RESEND_API_KEY=your-resend-api-key
MAILSLURP_API_KEY=your-mailslurp-api-key
FROM_EMAIL=noreply@example.com
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('   Please update the values according to your setup.\n');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    console.log('   Please create the .env file manually with the content from .env.example\n');
  }
}

// Check if MongoDB is accessible
console.log('🔍 Checking MongoDB connection...');
const mongoose = require('mongoose');

// Set a temporary connection string for testing
const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bellybasket';

mongoose.connect(testUri)
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('   Database:', testUri);
  })
  .catch((error) => {
    console.log('❌ MongoDB connection failed!');
    console.log('   Error:', error.message);
    console.log('   Please make sure MongoDB is running and accessible.');
    console.log('   You can start MongoDB with: mongod');
  })
  .finally(() => {
    mongoose.disconnect();
    console.log('\n📋 Next steps:');
    console.log('   1. Update the .env file with your actual values');
    console.log('   2. Start the backend: npm start');
    console.log('   3. Test the API: node test-categories.js');
    console.log('   4. The frontend will automatically use the real API');
    console.log('\n🎉 Categories API setup complete!');
  });
