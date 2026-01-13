const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Category = require('../models/Category');
const Organization = require('../models/Organization');
const User = require('../models/User');

async function listAllCategories() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all categories (both active and inactive)
    const allCategories = await Category.find({})
      .populate('organizationId', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1, organizationId: 1 });

    console.log(`📊 Total categories (active + inactive): ${allCategories.length}\n`);

    // Group by name (case-insensitive)
    const categoriesByName = {};
    allCategories.forEach(cat => {
      const key = cat.name.toLowerCase().trim();
      if (!categoriesByName[key]) {
        categoriesByName[key] = [];
      }
      categoriesByName[key].push(cat);
    });

    console.log('📋 All Categories by Name:\n');
    console.log('='.repeat(80));
    
    Object.keys(categoriesByName).sort().forEach(nameKey => {
      const cats = categoriesByName[nameKey];
      console.log(`\n${nameKey} (${cats.length} category/categories):`);
      console.log('-'.repeat(80));
      cats.forEach((cat, index) => {
        console.log(`  ${index + 1}. ID: ${cat._id}`);
        console.log(`     Name: "${cat.name}" | Display: "${cat.displayName}"`);
        console.log(`     Emoji: ${cat.emoji}`);
        console.log(`     Organization: ${cat.organizationId?.name || 'N/A'} (${cat.organizationId?._id || cat.organizationId || 'no-id'})`);
        console.log(`     Active: ${cat.isActive}`);
        console.log(`     Created: ${cat.createdAt}`);
        console.log('');
      });
    });

    // Specifically check for "fruit" or "fruits"
    console.log('\n\n🔍 Specifically checking for "fruit"/"fruits" categories:\n');
    const fruitCategories = allCategories.filter(cat => 
      cat.name.toLowerCase().trim() === 'fruits' || 
      cat.name.toLowerCase().trim() === 'fruit' ||
      cat.displayName.toLowerCase().trim() === 'fruits' ||
      cat.displayName.toLowerCase().trim() === 'fruit'
    );

    if (fruitCategories.length > 0) {
      console.log(`Found ${fruitCategories.length} "fruit"/"fruits" category(ies):\n`);
      fruitCategories.forEach((cat, index) => {
        console.log(`${index + 1}. ID: ${cat._id}`);
        console.log(`   Name: "${cat.name}" | Display: "${cat.displayName}"`);
        console.log(`   Emoji: ${cat.emoji}`);
        console.log(`   Organization: ${cat.organizationId?.name || 'N/A'} (${cat.organizationId?._id || cat.organizationId || 'no-id'})`);
        console.log(`   Active: ${cat.isActive}`);
        console.log(`   Created: ${cat.createdAt}`);
        console.log('');
      });
    } else {
      console.log('No "fruit"/"fruits" categories found.\n');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  listAllCategories();
}

module.exports = listAllCategories;
