const Product = require("../models/Product");
const Shop = require("../models/Shop");
const Cart = require("../models/Cart");
const Category = require("../models/Category"); // Add Category import
const { ObjectId } = require("mongodb");

// Safe parser to accept arrays or JSON strings
const ensureArray = (maybeArrayOrJson) => {
  if (!maybeArrayOrJson) return [];
  if (Array.isArray(maybeArrayOrJson)) return maybeArrayOrJson;
  try {
    const parsed = JSON.parse(maybeArrayOrJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

// Helper function to convert category name to category ID
const getCategoryId = async (categoryInput) => {
  if (!categoryInput) return null;
  
  // If it's already an ObjectId, return it
  if (ObjectId.isValid(categoryInput)) {
    return categoryInput;
  }
  
  // If it's a string (category name), find the category by name
  try {
    const category = await Category.findOne({ 
      name: { $regex: new RegExp(categoryInput, 'i') } 
    });
    return category ? category._id : null;
  } catch (error) {
    console.error('Error finding category:', error);
    return null;
  }
};

// Get a single product by ID
const getAllShopProducts = async (req, res) => {
  try {
    const owner = req.user.userId;
    const searchText = req.query.search || "";
    const products = await Product.find({ 
      owner: new ObjectId(owner), 
      name: { $regex: searchText, $options: "i" } 
    }).populate('category', 'name slug'); // Populate category with name and slug
    
    res.status(200).json({ products });
  } catch (error) {
    console.error("Get Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductCounts = async (req, res) => {
  try {
    try {
      const counts = await Product.countDocuments();
      return res.status(201).json({ counts });
    } catch (validationError) {
      console.log(validationError);
      let message = "Validation error";
      for (let key in validationError.errors) {
        message = validationError.errors[key].message;
      }
      return res.status(400).json({ message });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get counts grouped by category, optionally filtered by shopId (mapped to owner)
const getCountsByCategory = async (req, res) => {
  try {
    const { shopId } = req.query;

    const match = {};
    if (shopId) {
      const shop = await Shop.findById(shopId);
      if (shop && shop.owner) {
        match.owner = new ObjectId(shop.owner);
      }
    }

    const results = await Product.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform into a map: { categoryName: count }
    const counts = {};
    for (const row of results) {
      const key = row._id || "Uncategorized";
      counts[key] = row.count;
    }

    return res.status(200).json({ counts });
  } catch (error) {
    console.error("getCountsByCategory Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// const getProducts = async (req, res) => {
//   console.log("getProducts-line38");

//   try {
//     const latitude = req.headers["x-user-latitude"];
//     const longitude = req.headers["x-user-longitude"];
//     const { searchText, category, shopId, page = 1, limit = 10 } = req.body;

//     console.log(req.body);
//     console.log("latitude line 46: ", latitude);
//     console.log("longitude: ", longitude);

//     if (latitude && longitude) {
//       // Find nearest shops using $near operator
//       const nearestShops = await Shop.find({
//         "address.location": {
//           $near: {
//             $geometry: {
//               type: "Point",
//               coordinates: [parseFloat(longitude), parseFloat(latitude)],
//             },
//             $maxDistance: 5000,
//           },
//         },
//         ...(shopId ? { _id: shopId } : {}), // Include shopId only if provided
//       }).limit(5);

//       console.log(nearestShops);

//       if (nearestShops.length > 0) {
//         let shopProducts = [];

//         for (const shop of nearestShops) {
//           const skip = (page - 1) * limit;
//           const ownerId = shop.owner.toString();

//           // Query products based on owner and category
//           const products = await Product.find({
//             owner: ownerId,
//             ...(category
//               ? category == "All"
//                 ? {}
//                 : { category: category }
//               : {}),
//             ...(searchText
//               ? { name: { $regex: searchText, $options: "i" } }
//               : {}), // Apply search text filter
//           })
//             .skip(skip)
//             .limit(parseInt(limit))
//             .exec();

//           console.log(products);

//           shopProducts.push({
//             shopName: shop.name,
//             shopId: shop._id,
//             products: products,
//           });
//         }
//         return res.status(200).json({ products: shopProducts });
//       } else {
//         return res.status(404).json({ message: "No nearby shops found." });
//       }
//     } else {
//       return res
//         .status(400)
//         .json({ message: "Location coordinates not provided." });
//     }
//   } catch (error) {
//     console.error("Get Products Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const getProducts = async (req, res) => {
  // Temporarily disabled proximity filtering: return products from all shops (or specific shop)
  try {
    const { searchText, category, shopId, page = 1, limit = 10 } = req.body;

    // Determine which shops to query: specific shop or all shops
    let shopsToQuery = [];
    if (shopId) {
      const shop = await Shop.findById(shopId);
      if (shop) shopsToQuery = [shop];
    } else {
      shopsToQuery = await Shop.find({});
    }

    if (!shopsToQuery || shopsToQuery.length === 0) {
      return res.status(200).json({ products: [] });
    }

    // Resolve category input to one or many category ids (include descendants)
    let categoryIds = null;
    if (category && category !== "All") {
      try {
        let rootId = null;
        if (ObjectId.isValid(category)) {
          rootId = new ObjectId(category);
        } else {
          // try name first, then slug
          const catDoc = await Category.findOne({
            $or: [
              { name: { $regex: new RegExp(`^${category}$`, 'i') } },
              { slug: String(category).toLowerCase() }
            ]
          });
          rootId = catDoc ? catDoc._id : null;
        }

        if (rootId) {
          // collect descendants
          const all = await Category.find({ isActive: true }).lean();
          const ids = [];
          const visit = (id) => {
            ids.push(String(id));
            for (const c of all) {
              if (String(c.parentId) === String(id)) visit(c._id);
            }
          };
          visit(rootId);
          categoryIds = ids.map((id) => new ObjectId(id));
        }
      } catch (e) {
        console.warn('Category resolution failed:', e?.message || e);
      }
    }

    const shopProducts = [];
    const skip = (page - 1) * limit;

    for (const shop of shopsToQuery) {
      const ownerId = shop.owner.toString();

      const query = {
        owner: ownerId,
        ...(categoryIds ? { category: { $in: categoryIds } } : {}),
        ...(searchText ? { name: { $regex: searchText, $options: "i" } } : {}),
      };

      const products = await Product.find(query)
        .populate('category', 'name slug')
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

      shopProducts.push({
        shopName: shop.name,
        shopId: shop._id,
        products,
      });
    }

    return res.status(200).json({ products: shopProducts });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    let query = {};
    const latitude = req.headers["x-user-latitude"];
    const longitude = req.headers["x-user-longitude"];
    const {
      searchText,
      category,
      shopId,
      page = 1,
      limit = 10,
      Nearby,
    } = req.body;

    console.log(req.body);

    if (searchText && searchText != "") {
      query.name = { $regex: searchText, $options: "i" };
    }
    if (category && category != "") {
      query.category = category;
    }
    if (shopId && shopId != "") {
      const shop = await Shop.findById(shopId);
      const ownerId = shop?.owner;
      console.log(shop, shopId, "djlsjflsfjlsfjlskjfl");

      query.owner = new ObjectId(ownerId);
    }
    if (latitude && longitude) {
      const nearestShops = await Shop.find({
        "address.location": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: 5000,
          },
        },
      }).limit(5);

      if (nearestShops.length > 0) {
        let ownerIds = [];
        if (!shopId || shopId == "") {
          ownerIds = nearestShops.map((shop) => shop.owner.toString());
          query.owner = { $in: ownerIds };
        }
        console.log(query.owner);
      } else {
        return res.json({ products: [] });
      }
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('category', 'name slug') // Populate category with name and slug
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found with the specified criteria" });
    }

    // console.log(req.user, ": req.user");

    // // Get cart items for the user
    // const userId = req.user.userId;
    // const userCart = await Cart.findOne({ user: userId }).populate(
    //   "items.product"
    // );

    // // Add product quantity to each product in the response
    // const productsWithQuantity = products.map((product) => {
    //   const cartItem = userCart?.items.find((item) =>
    //     item.product._id.equals(product._id)
    //   );
    //   const quantity = cartItem ? cartItem.quantity : 0;
    //   return { ...product._doc, quantity };
    // });

    console.log(products, "products");

    res.status(200).json({ products: products });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      quantity,
      category,
      price,
      compareAtPrice,
      costPerItem,
      chargeTax,
      trackQuantity,
      continueSellingWhenOutOfStock,
      sku,
      barcode,
      isPhysicalProduct,
      weight,
      weightUnit,
      options,
      variants,
      seoTitle,
      seoDescription,
    } = req.body;
    let product;
    const owner = req.user.userId;

    const shop = await Shop.findOne({ owner });

    if (!shop) {
      return res.status(400).json({ error: "No shop found for this user." });
    }

    // Prevent creating or updating products until the shop is approved
    if (!shop.approved) {
      return res.status(403).json({
        success: false,
        code: "SHOP_NOT_APPROVED",
        message:
          "Your store is pending admin approval. You can leave a comment for the admin, but cannot add products yet.",
      });
    }

    let image = [];
    if (req.files && req.files.length > 0) {
      image = req.files.map((file) => file.path); // Map each file to its path
    }

    // Convert category name to category ID if needed
    const categoryId = await getCategoryId(category);

    if (req.params.id) {
      // Update existing product if product ID is provided
      const parsedOptions = options ? JSON.parse(options) : [];
      const parsedVariants = variants ? JSON.parse(variants) : [];
      product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          name,
          description,
          quantity,
          category: categoryId, // Use the converted category ID
          price,
          compareAtPrice,
          costPerItem,
          chargeTax,
          trackQuantity,
          continueSellingWhenOutOfStock,
          sku,
          barcode,
          isPhysicalProduct,
          weight,
          weightUnit,
          options: parsedOptions,
          variants: parsedVariants,
          seo: { title: seoTitle, description: seoDescription },
          image,
          owner,
          shop: shop._id,
        },
        { new: true }
      );
    } else {
      // Create new product if no product ID is provided
      const products = await Product.find({}).sort({ createDate: 1 });
      const parsedOptions = options ? JSON.parse(options) : [];
      const parsedVariants = variants ? JSON.parse(variants) : [];

      if (!products[0]) {
        product = new Product({
          name,
          description,
          quantity,
          category: categoryId, // Use the converted category ID
          price,
          compareAtPrice,
          costPerItem,
          chargeTax,
          trackQuantity,
          continueSellingWhenOutOfStock,
          sku,
          barcode,
          isPhysicalProduct,
          weight,
          weightUnit,
          options: parsedOptions,
          variants: parsedVariants,
          seo: { title: seoTitle, description: seoDescription },
          image,
          owner,
          shop: shop._id, // Include shop ID in product
          createDate: new Date(),
          updateDate: new Date(),
        });
      } else if (
        !products[0].startDate ||
        !products[0].endDate ||
        !products[0].discountPercent
      ) {
        product = new Product({
          name,
          description,
          quantity,
          category: categoryId, // Use the converted category ID
          price,
          compareAtPrice,
          costPerItem,
          chargeTax,
          trackQuantity,
          continueSellingWhenOutOfStock,
          sku,
          barcode,
          isPhysicalProduct,
          weight,
          weightUnit,
          options: parsedOptions,
          variants: parsedVariants,
          seo: { title: seoTitle, description: seoDescription },
          image,
          owner,
          shop: shop._id, // Include shop ID in product
          createDate: new Date(),
          updateDate: new Date(),
        });
      } else {
        product = new Product({
          name,
          description,
          quantity,
          category: categoryId, // Use the converted category ID
          price,
          compareAtPrice,
          costPerItem,
          chargeTax,
          trackQuantity,
          continueSellingWhenOutOfStock,
          sku,
          barcode,
          isPhysicalProduct,
          weight,
          weightUnit,
          options: parsedOptions,
          variants: parsedVariants,
          seo: { title: seoTitle, description: seoDescription },
          image,
          owner,
          shop: shop._id, // Include shop ID in product
          createDate: new Date(),
          updateDate: new Date(),
          // startDate: products[0].startDate,
          // endDate: products[0].endDate,
          // discountPercent: products[0].discountPercent,
        });
      }

      await product.save();
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error("Error creating/updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ product });
  } catch (error) {
    console.error("Get Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update a product by ID
const updateProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      name,
      description,
      price,
      compareAtPrice,
      costPerItem,
      chargeTax,
      quantity,
      trackQuantity,
      continueSellingWhenOutOfStock,
      category,
      sku,
      barcode,
      isPhysicalProduct,
      weight,
      weightUnit,
      options,
      variants,
      seoTitle,
      seoDescription,
    } = req.body;
    console.log(req.body);

    let image = [];
    let updatedProduct;
    // Convert category input (name/id) to ObjectId if possible
    const categoryId = await getCategoryId(category);

    if (req.files && req.files.length > 0) {
      image = req.files.map((file) => file.path); // Map each file to its path
      const parsedOptions = ensureArray(options);
      const parsedVariants = ensureArray(variants);
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          name,
          description,
          price,
          compareAtPrice,
          costPerItem,
          chargeTax,
          quantity,
          trackQuantity,
          continueSellingWhenOutOfStock,
          category: categoryId,
          sku,
          barcode,
          isPhysicalProduct,
          weight,
          weightUnit,
          options: parsedOptions,
          variants: parsedVariants,
          seo: { title: seoTitle, description: seoDescription },
          image,
        },
        { new: true }
      );
    } else {
      console.log(123456789);
      const parsedOptions = ensureArray(options);
      const parsedVariants = ensureArray(variants);
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          name,
          description,
          price,
          compareAtPrice,
          costPerItem,
          chargeTax,
          quantity,
          trackQuantity,
          continueSellingWhenOutOfStock,
          category: categoryId,
          sku,
          barcode,
          isPhysicalProduct,
          weight,
          weightUnit,
          options: parsedOptions,
          variants: parsedVariants,
          seo: { title: seoTitle, description: seoDescription },
        },
        { new: true }
      );
    }
    console.log("updatedProduct");
    console.log(updatedProduct);
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a product by ID
const deleteProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If the product is deleted successfully, remove it from all carts
    await Cart.updateMany(
      { "items.product": productId },
      { $pull: { items: { product: productId } } }
    );

    res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Delete Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const setDiscountDate = async (req, res) => {
  console.log("setDiscountDate");
  try {
    const productId = new ObjectId(req.params.id);
    const { startDate, endDate, discountPercent } = req.body;
    console.log(startDate, endDate, discountPercent);
    console.log(productId, "product ID");

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { startDate, endDate, discountPercent },
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Delete Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductByCategory = async (req, res) => {
  try {
    let query = {};
    const latitude = req.headers["x-user-latitude"];
    const longitude = req.headers["x-user-longitude"];
    const { category, shopId } = req.params;
    const page = 1, limit = 10;

    if (category && category != "") {
      query.category = category;
    }

    if (shopId && shopId != "") {
      const shop = await Shop.findById(shopId);
      const ownerId = shop?.owner;
      query.owner = new ObjectId(ownerId);
    }

    if (latitude && longitude) {
      const nearestShops = await Shop.find({
        "address.location": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: 5000,
          },
        },
      }).limit(5);
      if (nearestShops.length > 0) {
        let ownerIds = [];
        if (!shopId || shopId == "") {
          ownerIds = nearestShops.map((shop) => shop.owner.toString());
          query.owner = { $in: ownerIds };
        }
        console.log(query.owner);
      } else {
        return res.json({ products: [] });
      }
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('category', 'name slug') // Populate category with name and slug
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found with the specified criteria" });
    }

    res.status(200).json({ products: products });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllProductList = async (req, res) => {
  try {
    const productList = await Product.find().populate('category', 'name slug'); // Populate category with name and slug
    console.log(productList, "........................");

    res.status(200).json({ products: productList, message: "success" });
  } catch (error) {
    console.error("Get All Product List Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get discounted products only (discountPercent > 0 and within date window if set)
const getDiscountedProducts = async (req, res) => {
  try {
    const now = new Date();
    const query = {
      discountPercent: { $gt: 0 },
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ updateDate: -1 })
      .limit(20);

    return res.status(200).json({ products });
  } catch (error) {
    console.error('getDiscountedProducts Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};




module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  getAllShopProducts,
  getProductCounts,
  getProducts,
  setDiscountDate,
  getProductByCategory,
  getAllProductList,
  getCountsByCategory,
  getDiscountedProducts,
};
