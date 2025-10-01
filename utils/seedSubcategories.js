const Category = require('../models/Category');

const seedSubcategories = async () => {
  try {
    console.log('Starting to seed subcategories...');
    
    const rootCategories = await Category.find({ parentId: null }).sort({ sortOrder: 1 });
    
    if (rootCategories.length === 0) {
      console.log('No root categories found. Please run seedCategories first.');
      return;
    }

    const existingSubcategories = await Category.countDocuments({ parentId: { $ne: null } });
    if (existingSubcategories > 0) {
      console.log('Subcategories already seeded, skipping...');
      return;
    }

    // Define all possible subcategories for each parent
    const subcategoriesData = {
      'Fruits & Vegetables': [
        { name: 'Fresh Fruits', slug: 'fresh-fruits', description: 'Fresh seasonal and exotic fruits' },
        { name: 'Fresh Vegetables', slug: 'fresh-vegetables', description: 'Fresh leafy and root vegetables' },
        { name: 'Organic Produce', slug: 'organic-produce', description: 'Certified organic fruits and vegetables' },
        { name: 'Exotic Fruits', slug: 'exotic-fruits', description: 'Imported and exotic fruits' },
        { name: 'Herbs & Spices', slug: 'herbs-spices', description: 'Fresh herbs and cooking spices' }
      ],
      'Dairy, Bread & Eggs': [
        { name: 'Milk & Dairy', slug: 'milk-dairy', description: 'Fresh milk and dairy products' },
        { name: 'Bread & Bakery', slug: 'bread-bakery', description: 'Fresh bread and bakery items' },
        { name: 'Eggs', slug: 'eggs', description: 'Fresh farm eggs' },
        { name: 'Cheese & Butter', slug: 'cheese-butter', description: 'Variety of cheeses and butter' },
        { name: 'Yogurt & Curd', slug: 'yogurt-curd', description: 'Fresh yogurt and curd products' }
      ],
      'Snacks & Munchies': [
        { name: 'Chips & Crisps', slug: 'chips-crisps', description: 'Potato chips and crispy snacks' },
        { name: 'Nuts & Dry Fruits', slug: 'nuts-dry-fruits', description: 'Healthy nuts and dried fruits' },
        { name: 'Namkeen & Mixtures', slug: 'namkeen-mixtures', description: 'Traditional Indian snacks' },
        { name: 'Popcorn & Puffs', slug: 'popcorn-puffs', description: 'Light and airy snacks' },
        { name: 'Energy Bars', slug: 'energy-bars', description: 'Healthy energy bars and snacks' }
      ],
      'Bakery & Biscuits': [
        { name: 'Cookies & Biscuits', slug: 'cookies-biscuits', description: 'Sweet cookies and biscuits' },
        { name: 'Cakes & Pastries', slug: 'cakes-pastries', description: 'Fresh cakes and pastries' },
        { name: 'Bread Varieties', slug: 'bread-varieties', description: 'Different types of bread' },
        { name: 'Rusk & Toast', slug: 'rusk-toast', description: 'Crispy rusk and toast items' },
        { name: 'Baking Essentials', slug: 'baking-essentials', description: 'Ingredients for baking' }
      ],
      'Breakfast & Instant Food': [
        { name: 'Cereals & Muesli', slug: 'cereals-muesli', description: 'Breakfast cereals and muesli' },
        { name: 'Instant Noodles', slug: 'instant-noodles', description: 'Quick cooking noodles' },
        { name: 'Ready to Eat', slug: 'ready-to-eat', description: 'Instant ready to eat meals' },
        { name: 'Breakfast Mixes', slug: 'breakfast-mixes', description: 'Instant breakfast mixes' },
        { name: 'Oats & Porridge', slug: 'oats-porridge', description: 'Healthy oats and porridge' }
      ],
      'Tea, Coffee & Health Drink': [
        { name: 'Tea Varieties', slug: 'tea-varieties', description: 'Different types of tea' },
        { name: 'Coffee Products', slug: 'coffee-products', description: 'Coffee beans and instant coffee' },
        { name: 'Green Tea', slug: 'green-tea', description: 'Health benefits green tea' },
        { name: 'Herbal Teas', slug: 'herbal-teas', description: 'Medicinal and herbal teas' },
        { name: 'Health Drinks', slug: 'health-drinks', description: 'Nutritional health drinks' }
      ],
      'Cold Drinks & Juices': [
        { name: 'Soft Drinks', slug: 'soft-drinks', description: 'Carbonated soft drinks' },
        { name: 'Fresh Juices', slug: 'fresh-juices', description: 'Natural fruit juices' },
        { name: 'Energy Drinks', slug: 'energy-drinks', description: 'High energy beverages' },
        { name: 'Sparkling Water', slug: 'sparkling-water', description: 'Carbonated water drinks' },
        { name: 'Mocktails', slug: 'mocktails', description: 'Non-alcoholic cocktail drinks' }
      ],
      'Sweet Tooth': [
        { name: 'Chocolates', slug: 'chocolates', description: 'Various chocolate products' },
        { name: 'Candies & Toffees', slug: 'candies-toffees', description: 'Sweet candies and toffees' },
        { name: 'Indian Sweets', slug: 'indian-sweets', description: 'Traditional Indian sweets' },
        { name: 'Ice Cream', slug: 'ice-cream', description: 'Frozen desserts and ice cream' },
        { name: 'Dessert Mixes', slug: 'dessert-mixes', description: 'Instant dessert preparation mixes' }
      ],
      'Atta, Rice & Dal': [
        { name: 'Wheat Flour', slug: 'wheat-flour', description: 'Different types of wheat flour' },
        { name: 'Rice Varieties', slug: 'rice-varieties', description: 'Different types of rice' },
        { name: 'Pulses & Dal', slug: 'pulses-dal', description: 'Various pulses and lentils' },
        { name: 'Millets', slug: 'millets', description: 'Healthy millet grains' },
        { name: 'Pasta & Noodles', slug: 'pasta-noodles', description: 'Italian pasta and noodles' }
      ],
      'Masala, Oil & More': [
        { name: 'Cooking Oils', slug: 'cooking-oils', description: 'Various cooking oils' },
        { name: 'Spices & Masalas', slug: 'spices-masalas', description: 'Whole and ground spices' },
        { name: 'Ghee & Butter', slug: 'ghee-butter', description: 'Pure ghee and butter' },
        { name: 'Salt & Sugar', slug: 'salt-sugar', description: 'Basic cooking essentials' },
        { name: 'Vinegar & Sauces', slug: 'vinegar-sauces', description: 'Cooking vinegar and sauces' }
      ],
      'Sauces & Spreads': [
        { name: 'Tomato Sauces', slug: 'tomato-sauces', description: 'Various tomato-based sauces' },
        { name: 'Chutneys & Pickles', slug: 'chutneys-pickles', description: 'Traditional chutneys and pickles' },
        { name: 'Mayonnaise & Dips', slug: 'mayonnaise-dips', description: 'Creamy spreads and dips' },
        { name: 'Jam & Jellies', slug: 'jam-jellies', description: 'Sweet fruit preserves' },
        { name: 'Honey & Syrups', slug: 'honey-syrups', description: 'Natural honey and syrups' }
      ],
      'Chicken, Meat & Fish': [
        { name: 'Fresh Chicken', slug: 'fresh-chicken', description: 'Fresh chicken cuts' },
        { name: 'Fresh Fish', slug: 'fresh-fish', description: 'Fresh fish and seafood' },
        { name: 'Fresh Meat', slug: 'fresh-meat', description: 'Fresh meat cuts' },
        { name: 'Frozen Meat', slug: 'frozen-meat', description: 'Frozen meat products' },
        { name: 'Processed Meat', slug: 'processed-meat', description: 'Processed meat products' }
      ],
      'Organic & Healthy Living': [
        { name: 'Organic Foods', slug: 'organic-foods', description: 'Certified organic food products' },
        { name: 'Superfoods', slug: 'superfoods', description: 'Nutrient-rich superfoods' },
        { name: 'Gluten Free', slug: 'gluten-free', description: 'Gluten-free food products' },
        { name: 'Vegan Products', slug: 'vegan-products', description: 'Plant-based vegan products' },
        { name: 'Health Supplements', slug: 'health-supplements', description: 'Nutritional supplements' }
      ],
      'Paan Corner': [
        { name: 'Paan Leaves', slug: 'paan-leaves', description: 'Fresh paan leaves' },
        { name: 'Paan Masala', slug: 'paan-masala', description: 'Traditional paan masala' },
        { name: 'Gutka & Tobacco', slug: 'gutka-tobacco', description: 'Gutka and tobacco products' },
        { name: 'Mouth Fresheners', slug: 'mouth-fresheners', description: 'Natural mouth fresheners' },
        { name: 'Paan Accessories', slug: 'paan-accessories', description: 'Paan making accessories' }
      ],
      'Baby Care': [
        { name: 'Baby Food', slug: 'baby-food', description: 'Nutritious baby food products' },
        { name: 'Baby Diapers', slug: 'baby-diapers', description: 'Comfortable baby diapers' },
        { name: 'Baby Wipes', slug: 'baby-wipes', description: 'Gentle baby wipes' },
        { name: 'Baby Care Products', slug: 'baby-care-products', description: 'Essential baby care items' },
        { name: 'Baby Toys', slug: 'baby-toys', description: 'Safe baby toys and accessories' }
      ],
      'Pharma & Wellness': [
        { name: 'Medicines', slug: 'medicines', description: 'Over-the-counter medicines' },
        { name: 'Vitamins', slug: 'vitamins', description: 'Essential vitamins and minerals' },
        { name: 'First Aid', slug: 'first-aid', description: 'First aid supplies' },
        { name: 'Health Monitors', slug: 'health-monitors', description: 'Health monitoring devices' },
        { name: 'Wellness Products', slug: 'wellness-products', description: 'General wellness products' }
      ],
      'Cleaning Essentials': [
        { name: 'Laundry Care', slug: 'laundry-care', description: 'Laundry detergents and fabric care' },
        { name: 'Dishwashing', slug: 'dishwashing', description: 'Dishwashing liquids and tablets' },
        { name: 'Floor Cleaners', slug: 'floor-cleaners', description: 'Floor cleaning products' },
        { name: 'Bathroom Cleaners', slug: 'bathroom-cleaners', description: 'Bathroom cleaning supplies' },
        { name: 'Kitchen Cleaners', slug: 'kitchen-cleaners', description: 'Kitchen cleaning products' }
      ],
      'Home & Office': [
        { name: 'Paper Products', slug: 'paper-products', description: 'Paper and stationery items' },
        { name: 'Kitchen Essentials', slug: 'kitchen-essentials', description: 'Essential kitchen items' },
        { name: 'Home Decor', slug: 'home-decor', description: 'Home decoration items' },
        { name: 'Storage Solutions', slug: 'storage-solutions', description: 'Home storage products' },
        { name: 'Office Supplies', slug: 'office-supplies', description: 'Office and work supplies' }
      ],
      'Personal Care': [
        { name: 'Hair Care', slug: 'hair-care', description: 'Hair care and styling products' },
        { name: 'Skin Care', slug: 'skin-care', description: 'Facial and body skin care' },
        { name: 'Oral Care', slug: 'oral-care', description: 'Dental hygiene products' },
        { name: 'Bath & Body', slug: 'bath-body', description: 'Bath and body care products' },
        { name: 'Men\'s Grooming', slug: 'mens-grooming', description: 'Men\'s personal care products' }
      ],
      'Pet Care': [
        { name: 'Dog Food', slug: 'dog-food', description: 'Nutritious dog food products' },
        { name: 'Cat Food', slug: 'cat-food', description: 'Healthy cat food options' },
        { name: 'Pet Accessories', slug: 'pet-accessories', description: 'Pet toys and accessories' },
        { name: 'Pet Hygiene', slug: 'pet-hygiene', description: 'Pet grooming and hygiene products' },
        { name: 'Pet Health', slug: 'pet-health', description: 'Pet health and wellness products' }
      ]
    };

    // Create subcategories with random distribution (some categories get 0, some get 1-3)
    const subcategoriesToCreate = [];
    let sortOrder = 1;
    let totalCreated = 0;

    for (const category of rootCategories) {
      const categoryName = category.name;
      const availableSubcategories = subcategoriesData[categoryName] || [];
      
      if (availableSubcategories.length > 0) {
        // Randomly decide how many subcategories this category gets (0-3)
        const maxSubcategories = Math.min(3, availableSubcategories.length);
        const numSubcategories = Math.floor(Math.random() * (maxSubcategories + 1));
        
        if (numSubcategories > 0) {
          // Randomly select subcategories
          const shuffled = [...availableSubcategories].sort(() => 0.5 - Math.random());
          
          for (let i = 0; i < numSubcategories && totalCreated < 100; i++) {
            const subcategoryData = shuffled[i];
            const subcategory = new Category({
              name: subcategoryData.name,
              slug: subcategoryData.slug,
              description: subcategoryData.description,
              parentId: category._id,
              isActive: true,
              sortOrder: sortOrder++,
              metaTitle: `${subcategoryData.name} - ${categoryName}`,
              metaDescription: subcategoryData.description
            });
            
            subcategoriesToCreate.push(subcategory);
            totalCreated++;
          }
        }
      }
    }

    // If we haven't reached 100 subcategories, add more from categories that have fewer
    if (totalCreated < 100) {
      for (const category of rootCategories) {
        const categoryName = category.name;
        const availableSubcategories = subcategoriesData[categoryName] || [];
        const existingCount = subcategoriesToCreate.filter(sub => sub.parentId.toString() === category._id.toString()).length;
        
        if (existingCount < 3 && availableSubcategories.length > existingCount && totalCreated < 100) {
          const remainingSubcategories = availableSubcategories.filter(sub => 
            !subcategoriesToCreate.some(existing => 
              existing.parentId.toString() === category._id.toString() && existing.name === sub.name
            )
          );
          
          for (const subcategoryData of remainingSubcategories) {
            if (totalCreated >= 100) break;
            
            const subcategory = new Category({
              name: subcategoryData.name,
              slug: subcategoryData.slug,
              description: subcategoryData.description,
              parentId: category._id,
              isActive: true,
              sortOrder: sortOrder++,
              metaTitle: `${subcategoryData.name} - ${categoryName}`,
              metaDescription: subcategoryData.description
            });
            
            subcategoriesToCreate.push(subcategory);
            totalCreated++;
          }
        }
      }
    }

    // Save all subcategories
    if (subcategoriesToCreate.length > 0) {
      await Category.insertMany(subcategoriesToCreate);
      console.log(`✅ Successfully created ${subcategoriesToCreate.length} subcategories`);
      
      // Log distribution summary
      console.log('\n📊 Subcategory Distribution Summary:');
      for (const category of rootCategories) {
        const count = subcategoriesToCreate.filter(sub => sub.parentId.toString() === category._id.toString()).length;
        console.log(`  ${category.name}: ${count} subcategories`);
      }
    }

    console.log(`📈 Total categories in database: ${await Category.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error seeding subcategories:', error);
  }
};

module.exports = { seedSubcategories };
