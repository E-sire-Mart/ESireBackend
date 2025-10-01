const Category = require('../models/Category');

const seedCategories = async () => {
  try {
    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log('Categories already seeded, skipping...');
      return;
    }

    // Create root categories for grocery store
    const fruitsVegetables = new Category({
      name: 'Fruits & Vegetables',
      slug: 'fruits-vegetables',
      description: 'Fresh fruits and vegetables',
      isActive: true,
      sortOrder: 1,
      metaTitle: 'Fruits & Vegetables - Fresh Produce',
      metaDescription: 'Shop fresh fruits and vegetables for a healthy lifestyle'
    });

    const dairyBreadEggs = new Category({
      name: 'Dairy, Bread & Eggs',
      slug: 'dairy-bread-eggs',
      description: 'Fresh dairy products, bread and eggs',
      isActive: true,
      sortOrder: 2,
      metaTitle: 'Dairy, Bread & Eggs - Fresh Essentials',
      metaDescription: 'Get your daily essentials with fresh dairy, bread and eggs'
    });

    const snacksMunchies = new Category({
      name: 'Snacks & Munchies',
      slug: 'snacks-munchies',
      description: 'Delicious snacks and munchies',
      isActive: true,
      sortOrder: 3,
      metaTitle: 'Snacks & Munchies - Tasty Treats',
      metaDescription: 'Satisfy your cravings with our selection of snacks and munchies'
    });

    const bakeryBiscuits = new Category({
      name: 'Bakery & Biscuits',
      slug: 'bakery-biscuits',
      description: 'Fresh bakery items and biscuits',
      isActive: true,
      sortOrder: 4,
      metaTitle: 'Bakery & Biscuits - Fresh Baked Goods',
      metaDescription: 'Enjoy fresh bakery items and delicious biscuits'
    });

    const breakfastInstantFood = new Category({
      name: 'Breakfast & Instant Food',
      slug: 'breakfast-instant-food',
      description: 'Breakfast essentials and instant food items',
      isActive: true,
      sortOrder: 5,
      metaTitle: 'Breakfast & Instant Food - Quick Meals',
      metaDescription: 'Start your day right with breakfast essentials and quick instant meals'
    });

    const teaCoffeeHealthDrink = new Category({
      name: 'Tea, Coffee & Health Drink',
      slug: 'tea-coffee-health-drink',
      description: 'Beverages for health and wellness',
      isActive: true,
      sortOrder: 6,
      metaTitle: 'Tea, Coffee & Health Drinks - Healthy Beverages',
      metaDescription: 'Stay healthy with our selection of tea, coffee and health drinks'
    });

    const coldDrinksJuices = new Category({
      name: 'Cold Drinks & Juices',
      slug: 'cold-drinks-juices',
      description: 'Refreshing cold drinks and natural juices',
      isActive: true,
      sortOrder: 7,
      metaTitle: 'Cold Drinks & Juices - Refreshing Beverages',
      metaDescription: 'Stay refreshed with cold drinks and natural juices'
    });

    const sweetTooth = new Category({
      name: 'Sweet Tooth',
      slug: 'sweet-tooth',
      description: 'Sweets, chocolates and desserts',
      isActive: true,
      sortOrder: 8,
      metaTitle: 'Sweet Tooth - Delicious Treats',
      metaDescription: 'Indulge your sweet tooth with our selection of treats'
    });

    const attaRiceDal = new Category({
      name: 'Atta, Rice & Dal',
      slug: 'atta-rice-dal',
      description: 'Grains, rice and lentils',
      isActive: true,
      sortOrder: 9,
      metaTitle: 'Atta, Rice & Dal - Staple Grains',
      metaDescription: 'Get your staple grains including atta, rice and dal'
    });

    const masalaOilMore = new Category({
      name: 'Masala, Oil & More',
      slug: 'masala-oil-more',
      description: 'Spices, cooking oils and more',
      isActive: true,
      sortOrder: 10,
      metaTitle: 'Masala, Oil & More - Cooking Essentials',
      metaDescription: 'Essential cooking ingredients including spices and oils'
    });

    const saucesSpreads = new Category({
      name: 'Sauces & Spreads',
      slug: 'sauces-spreads',
      description: 'Condiments, sauces and spreads',
      isActive: true,
      sortOrder: 11,
      metaTitle: 'Sauces & Spreads - Flavor Enhancers',
      metaDescription: 'Enhance your meals with our selection of sauces and spreads'
    });

    const chickenMeatFish = new Category({
      name: 'Chicken, Meat & Fish',
      slug: 'chicken-meat-fish',
      description: 'Fresh meat, chicken and fish',
      isActive: true,
      sortOrder: 12,
      metaTitle: 'Chicken, Meat & Fish - Fresh Protein',
      metaDescription: 'Get fresh protein with our selection of meat, chicken and fish'
    });

    const organicHealthyLiving = new Category({
      name: 'Organic & Healthy Living',
      slug: 'organic-healthy-living',
      description: 'Organic products for healthy living',
      isActive: true,
      sortOrder: 13,
      metaTitle: 'Organic & Healthy Living - Natural Products',
      metaDescription: 'Choose natural and organic products for a healthier lifestyle'
    });

    const paanCorner = new Category({
      name: 'Paan Corner',
      slug: 'paan-corner',
      description: 'Traditional paan and related products',
      isActive: true,
      sortOrder: 14,
      metaTitle: 'Paan Corner - Traditional Products',
      metaDescription: 'Experience traditional paan and related products'
    });

    const babyCare = new Category({
      name: 'Baby Care',
      slug: 'baby-care',
      description: 'Essential products for baby care',
      isActive: true,
      sortOrder: 15,
      metaTitle: 'Baby Care - Essential Products',
      metaDescription: 'Get all the essential products for your baby\'s care'
    });

    const pharmaWellness = new Category({
      name: 'Pharma & Wellness',
      slug: 'pharma-wellness',
      description: 'Pharmaceutical and wellness products',
      isActive: true,
      sortOrder: 16,
      metaTitle: 'Pharma & Wellness - Health Products',
      metaDescription: 'Maintain your health with pharmaceutical and wellness products'
    });

    const cleaningEssentials = new Category({
      name: 'Cleaning Essentials',
      slug: 'cleaning-essentials',
      description: 'Household cleaning products',
      isActive: true,
      sortOrder: 17,
      metaTitle: 'Cleaning Essentials - Household Cleaners',
      metaDescription: 'Keep your home clean with our cleaning essentials'
    });

    const homeOffice = new Category({
      name: 'Home & Office',
      slug: 'home-office',
      description: 'Products for home and office use',
      isActive: true,
      sortOrder: 18,
      metaTitle: 'Home & Office - Essential Supplies',
      metaDescription: 'Get essential supplies for your home and office'
    });

    const personalCare = new Category({
      name: 'Personal Care',
      slug: 'personal-care',
      description: 'Personal hygiene and care products',
      isActive: true,
      sortOrder: 19,
      metaTitle: 'Personal Care - Hygiene Products',
      metaDescription: 'Maintain personal hygiene with our care products'
    });

    const petCare = new Category({
      name: 'Pet Care',
      slug: 'pet-care',
      description: 'Products for pet care and nutrition',
      isActive: true,
      sortOrder: 20,
      metaTitle: 'Pet Care - Pet Products',
      metaDescription: 'Take care of your pets with our pet care products'
    });

    // Save all root categories
    await fruitsVegetables.save();
    await dairyBreadEggs.save();
    await snacksMunchies.save();
    await bakeryBiscuits.save();
    await breakfastInstantFood.save();
    await teaCoffeeHealthDrink.save();
    await coldDrinksJuices.save();
    await sweetTooth.save();
    await attaRiceDal.save();
    await masalaOilMore.save();
    await saucesSpreads.save();
    await chickenMeatFish.save();
    await organicHealthyLiving.save();
    await paanCorner.save();
    await babyCare.save();
    await pharmaWellness.save();
    await cleaningEssentials.save();
    await homeOffice.save();
    await personalCare.save();
    await petCare.save();

    console.log('Grocery categories seeded successfully!');
    console.log(`Created ${await Category.countDocuments()} categories`);

  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};

module.exports = { seedCategories };
