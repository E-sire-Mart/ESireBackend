const mongoose = require("mongoose");

// Variant schema to support Shopify-like variants per option combination
const productVariantSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    sku: { type: String, trim: true },
    barcode: { type: String, trim: true },
    price: { type: Number, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    costPerItem: { type: Number, min: 0 },
    inventoryQuantity: { type: Number, default: 0, min: 0 },
    trackQuantity: { type: Boolean, default: true },
    continueSellingWhenOutOfStock: { type: Boolean, default: false },
    weight: { type: Number, min: 0 },
    weightUnit: { type: String, enum: ["g", "kg", "oz", "lb"], default: "g" },
    options: { type: Map, of: String }, // e.g., { Size: "M", Color: "Red" }
    image: { type: String },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  description: {
    type: String, // may contain rich text/HTML
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Product price is required"],
    min: [0, "Price must be non-negative"],
  },
  compareAtPrice: {
    type: Number,
    min: [0, "Compare-at price must be non-negative"],
  },
  chargeTax: { type: Boolean, default: false },
  costPerItem: { type: Number, min: 0 },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  quantity: {
    type: Number,
    required: [true, "Product quantity is required"],
    min: [0, "Quantity must be non-negative"],
  },
  trackQuantity: { type: Boolean, default: true },
  continueSellingWhenOutOfStock: { type: Boolean, default: false },
  sku: { type: String, trim: true },
  barcode: { type: String, trim: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: false,
  },
  image: {
    type: [String],
  },
  isPhysicalProduct: { type: Boolean, default: true },
  weight: { type: Number, min: 0 },
  weightUnit: { type: String, enum: ["g", "kg", "oz", "lb"], default: "g" },
  customsInformation: { type: String, trim: true },
  // Options represent option names e.g. ["Size", "Color"] similar to Shopify
  options: { type: [String], default: [] },
  variants: { type: [productVariantSchema], default: [] },
  seo: {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  discountPercent: {
    type: Number,
    min: [0, "Discount percent must be between 0 and 100"],
    max: [100, "Discount percent must be between 0 and 100"],
    default: 0,
  },
  createDate: {
    type: Date,
    default: Date.now,
  },
  updateDate: {
    type: Date,
    default: Date.now,
  },
  // Review and rating fields
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalRecommendations: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// Pre-save hook to update the updateDate before saving
productSchema.pre("save", function (next) {
  this.updateDate = new Date();
  next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
