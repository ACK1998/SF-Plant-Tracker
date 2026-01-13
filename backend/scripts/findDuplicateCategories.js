const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Category = require('../models/Category');
const Organization = require('../models/Organization');
const User = require('../models/User');

async function findDuplicateCategories() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all categories
    const allCategories = await Category.find({ isActive: true })
      .populate('organizationId', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1, organizationId: 1 });

    console.log(`📊 Total active categories: ${allCategories.length}\n`);

    // Group by normalized name (lowercase) and organization
    const categoryMap = new Map();
    
    allCategories.forEach(category => {
      const normalizedName = category.name.toLowerCase().trim();
      const orgId = category.organizationId?._id?.toString() || category.organizationId?.toString() || 'no-org';
      const key = `${normalizedName}|${orgId}`;
      
      if (!categoryMap.has(key)) {
        categoryMap.set(key, []);
      }
      categoryMap.get(key).push(category);
    });

    // Find duplicates (same name in same organization)
    const duplicates = [];
    categoryMap.forEach((categories, key) => {
      if (categories.length > 1) {
        duplicates.push({ key, categories });
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ No duplicate categories found!\n');
      
      // Check for case-insensitive duplicates across different organizations or with slight variations
      const nameGroups = new Map();
      allCategories.forEach(category => {
        const normalizedName = category.name.toLowerCase().trim();
        if (!nameGroups.has(normalizedName)) {
          nameGroups.set(normalizedName, []);
        }
        nameGroups.get(normalizedName).push(category);
      });

      const similarDuplicates = [];
      nameGroups.forEach((categories, normalizedName) => {
        if (categories.length > 1) {
          // Check if they're in the same organization
          const orgGroups = new Map();
          categories.forEach(cat => {
            const orgId = cat.organizationId?._id?.toString() || cat.organizationId?.toString() || 'no-org';
            if (!orgGroups.has(orgId)) {
              orgGroups.set(orgId, []);
            }
            orgGroups.get(orgId).push(cat);
          });

          orgGroups.forEach((cats, orgId) => {
            if (cats.length > 1) {
              similarDuplicates.push({ normalizedName, categories: cats, orgId });
            }
          });
        }
      });

      if (similarDuplicates.length > 0) {
        console.log('⚠️  Found potential duplicate categories (same normalized name in same organization):\n');
        similarDuplicates.forEach(({ normalizedName, categories, orgId }) => {
          console.log(`\n📋 "${normalizedName}" (${categories.length} duplicates in org ${orgId}):`);
          categories.forEach((cat, index) => {
            console.log(`   ${index + 1}. ID: ${cat._id}`);
            console.log(`      Name: "${cat.name}" | Display: "${cat.displayName}"`);
            console.log(`      Emoji: ${cat.emoji} | Org: ${cat.organizationId?.name || 'N/A'}`);
            console.log(`      Created: ${cat.createdAt}`);
            console.log(`      Active: ${cat.isActive}`);
          });
        });
      }
    } else {
      console.log(`⚠️  Found ${duplicates.length} duplicate category group(s):\n`);
      duplicates.forEach(({ key, categories }) => {
        const [name, orgId] = key.split('|');
        console.log(`\n📋 "${name}" (${categories.length} duplicates in org ${orgId}):`);
        categories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ID: ${cat._id}`);
          console.log(`      Name: "${cat.name}" | Display: "${cat.displayName}"`);
          console.log(`      Emoji: ${cat.emoji} | Org: ${cat.organizationId?.name || 'N/A'}`);
          console.log(`      Created: ${cat.createdAt}`);
          console.log(`      Active: ${cat.isActive}`);
        });
      });
    }

    // Also check specifically for "Fruits" or "fruits" (case-insensitive)
    console.log('\n\n🔍 Specifically checking for "Fruits" categories:\n');
    const fruitsCategories = allCategories.filter(cat => 
      cat.name.toLowerCase().trim() === 'fruits' || 
      cat.name.toLowerCase().trim() === 'fruit' ||
      cat.displayName.toLowerCase().trim() === 'fruits' ||
      cat.displayName.toLowerCase().trim() === 'fruit'
    );

    if (fruitsCategories.length > 0) {
      console.log(`Found ${fruitsCategories.length} "Fruits" category(ies):\n`);
      fruitsCategories.forEach((cat, index) => {
        console.log(`${index + 1}. ID: ${cat._id}`);
        console.log(`   Name: "${cat.name}" | Display: "${cat.displayName}"`);
        console.log(`   Emoji: ${cat.emoji}`);
        console.log(`   Organization: ${cat.organizationId?.name || 'N/A'} (${cat.organizationId?._id || cat.organizationId || 'no-id'})`);
        console.log(`   Created: ${cat.createdAt}`);
        console.log(`   Active: ${cat.isActive}`);
        console.log('');
      });
    } else {
      console.log('No "Fruits" categories found.\n');
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
  findDuplicateCategories();
}

module.exports = findDuplicateCategories;
