const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Shop = require('../models/Shop');

// Simple random helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
};

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

const adjectives = [
  'Fresh', 'Organic', 'Premium', 'Delicious', 'Crispy', 'Natural', 'Classic', 'Healthy', 'Tasty', 'Savory',
  'Creamy', 'Golden', 'Spicy', 'Zesty', 'Sweet', 'Rich', 'Smooth', 'Juicy', 'Aromatic', 'Nutty',
];

const productNouns = [
  'Apples', 'Bananas', 'Tomatoes', 'Onions', 'Milk', 'Bread', 'Eggs', 'Butter', 'Yogurt', 'Cheese',
  'Biscuits', 'Cereal', 'Noodles', 'Pasta', 'Tea', 'Coffee', 'Juice', 'Soda', 'Chocolate', 'Chips',
  'Rice', 'Flour', 'Lentils', 'Sugar', 'Salt', 'Oil', 'Sauce', 'Ketchup', 'Jam', 'Honey',
  'Chicken', 'Fish', 'Mutton', 'Tofu', 'Soap', 'Shampoo', 'Toothpaste', 'Cleaner', 'Tissue', 'Detergent',
];

const generateProductName = () => `${sample(adjectives)} ${sample(productNouns)}`;

async function seedProducts(count = 100) {
  // Ensure we have a shop to attach products to
  const shop = await Shop.findOne();
  if (!shop) {
    console.log('No shop found. Please create a shop first. Skipping product seeding.');
    return;
  }

  // Resolve owner from shop
  const owner = shop.owner;
  if (!owner) {
    console.log('Shop has no owner. Skipping product seeding.');
    return;
  }

  // Load categories
  const categories = await Category.find({ isActive: true });
  if (categories.length === 0) {
    console.log('No categories found. Please seed categories first. Skipping product seeding.');
    return;
  }

  // Ensure we end up with EXACTLY `count` products for this shop
  const existingForShop = await Product.countDocuments({ shop: shop._id });
  if (existingForShop >= count) {
    console.log(`Shop already has ${existingForShop} products. Skipping, target is ${count}.`);
    return;
  }

  const toCreate = count - existingForShop;
  console.log(`Seeding ${toCreate} products (target ${count}) across ${categories.length} categories for shop ${shop.name}...`);

  const createdProducts = [];
  for (let i = 0; i < toCreate; i += 1) {
    const category = sample(categories);
    const name = generateProductName();
    const price = randomFloat(1.0, 100.0, 2);
    const quantity = randomInt(0, 250);
    const sku = `SKU-${Date.now()}-${i}-${randomInt(1000, 9999)}`;
    const barcode = `BC${randomInt(100000000000, 999999999999)}`;

    const product = new Product({
      name,
      description: `${name} available now at a great price.`,
      quantity,
      category: category._id,
      price,
      compareAtPrice: Math.random() < 0.3 ? price + randomFloat(1, 20, 2) : undefined,
      chargeTax: Math.random() < 0.5,
      trackQuantity: true,
      continueSellingWhenOutOfStock: Math.random() < 0.1,
      sku,
      barcode,
      isPhysicalProduct: true,
      weight: randomFloat(0.1, 5.0, 2),
      weightUnit: sample(['g', 'kg', 'oz', 'lb']),
      options: [],
      variants: [],
      seo: { title: name, description: `${name} - buy online` },
      image: [],
      owner,
      shop: shop._id,
      createDate: new Date(),
      updateDate: new Date(),
    });

    await product.save();
    createdProducts.push(product._id);
  }

  if (createdProducts.length > 0) {
    // Register in shop.products (append)
    const uniqueSet = new Set([...(shop.products || []).map((id) => id.toString()), ...createdProducts.map((id) => id.toString())]);
    shop.products = Array.from(uniqueSet).map((id) => new mongoose.Types.ObjectId(id));
    await shop.save();
  }

  console.log(`Created ${createdProducts.length} products and registered them in shop.`);
}

module.exports = { seedProducts };


