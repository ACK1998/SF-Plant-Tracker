const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Category = require('../models/Category');
const PlantType = require('../models/PlantType');
const PlantVariety = require('../models/PlantVariety');
const Organization = require('../models/Organization');

async function mergeFruitsCategories() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find all categories related to fruits (case-insensitive)
    console.log('📋 Step 1: Finding all fruit-related categories...\n');
    const allCategories = await Category.find({})
      .populate('organizationId', 'name')
      .sort({ createdAt: 1 });

    const fruitCategories = allCategories.filter(cat => {
      const name = cat.name.toLowerCase().trim();
      const displayName = cat.displayName.toLowerCase().trim();
      return name === 'fruit' || name === 'fruits' || 
             displayName === 'fruit' || displayName === 'fruits';
    });

    console.log(`Found ${fruitCategories.length} fruit-related category(ies):`);
    fruitCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ID: ${cat._id}`);
      console.log(`     Name: "${cat.name}" | Display: "${cat.displayName}"`);
      console.log(`     Emoji: ${cat.emoji} | Org: ${cat.organizationId?.name || 'N/A'}`);
      console.log(`     Active: ${cat.isActive} | Created: ${cat.createdAt}`);
      console.log('');
    });

    if (fruitCategories.length === 0) {
      console.log('❌ No fruit categories found. Exiting.');
      await mongoose.connection.close();
      return;
    }

    // Step 2: Choose the primary category (oldest active one, or just the first one)
    const primaryCategory = fruitCategories[0];
    const otherCategories = fruitCategories.slice(1);

    console.log(`\n📋 Step 2: Primary category will be:`);
    console.log(`   ID: ${primaryCategory._id}`);
    console.log(`   Name: "${primaryCategory.name}" | Display: "${primaryCategory.displayName}"`);
    console.log(`   Emoji: ${primaryCategory.emoji}\n`);

    if (otherCategories.length === 0) {
      console.log('✅ Only one fruit category found. No merging needed.');
      
      // Still check for plant types with different case variations
      console.log('\n📋 Checking for plant types with case variations...\n');
      const plantTypes = await PlantType.find({
        $or: [
          { category: /^fruit$/i },
          { category: /^fruits$/i }
        ],
        isActive: true
      });

      console.log(`Found ${plantTypes.length} plant types with fruit category variations:`);
      const categoryCounts = {};
      plantTypes.forEach(pt => {
        const cat = pt.category || 'null';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        console.log(`   "${cat}": ${count} plant types`);
      });

      if (Object.keys(categoryCounts).length > 1) {
        console.log(`\n📋 Updating all plant types to use category: "${primaryCategory.name}"...`);
        const updateResult = await PlantType.updateMany(
          {
            $or: [
              { category: /^fruit$/i },
              { category: /^fruits$/i }
            ],
            isActive: true
          },
          {
            $set: { category: primaryCategory.name }
          }
        );
        console.log(`✅ Updated ${updateResult.modifiedCount} plant types\n`);
      }

      await mongoose.connection.close();
      return;
    }

    console.log(`\n📋 Categories to merge into primary (${otherCategories.length}):`);
    otherCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. "${cat.name}" (${cat._id})`);
    });

    // Step 3: Find all plant types using the categories to be merged
    console.log('\n📋 Step 3: Finding plant types to update...\n');
    const categoryNamesToMerge = otherCategories.map(cat => cat.name);
    const categoryNamesAll = fruitCategories.map(cat => cat.name);

    const plantTypesToUpdate = await PlantType.find({
      category: { $in: categoryNamesToMerge },
      isActive: true
    }).populate('organizationId', 'name');

    console.log(`Found ${plantTypesToUpdate.length} plant types to update:`);
    plantTypesToUpdate.forEach((pt, index) => {
      console.log(`   ${index + 1}. "${pt.name}" (category: "${pt.category}")`);
    });

    // Step 4: Update all plant types to use the primary category
    console.log(`\n📋 Step 4: Updating plant types to use primary category "${primaryCategory.name}"...`);
    const updateResult = await PlantType.updateMany(
      { category: { $in: categoryNamesToMerge }, isActive: true },
      { $set: { category: primaryCategory.name } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} plant types\n`);

    // Step 5: Also update any plant types with case variations
    console.log('📋 Step 5: Updating plant types with case variations...');
    const caseVariationUpdate = await PlantType.updateMany(
      {
        $or: [
          { category: /^fruit$/i },
          { category: /^fruits$/i }
        ],
        category: { $nin: [primaryCategory.name] },
        isActive: true
      },
      { $set: { category: primaryCategory.name } }
    );
    console.log(`✅ Updated ${caseVariationUpdate.modifiedCount} additional plant types\n`);

    // Step 6: Find and remove duplicate plant types
    console.log('📋 Step 6: Finding duplicate plant types...\n');
    const allFruitPlantTypes = await PlantType.find({
      category: primaryCategory.name,
      isActive: true
    }).sort({ name: 1, createdAt: 1 });

    // Group by name (case-insensitive) and organization
    const plantTypesByName = new Map();
    allFruitPlantTypes.forEach(pt => {
      const key = `${pt.name.toLowerCase().trim()}|${pt.organizationId?.toString() || 'no-org'}`;
      if (!plantTypesByName.has(key)) {
        plantTypesByName.set(key, []);
      }
      plantTypesByName.get(key).push(pt);
    });

    const duplicates = [];
    plantTypesByName.forEach((types, key) => {
      if (types.length > 1) {
        duplicates.push({ key, types });
      }
    });

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate plant type group(s):\n`);
      let duplicatesToRemove = [];
      
      duplicates.forEach(({ key, types }) => {
        console.log(`"${types[0].name}" (${types.length} duplicates):`);
        // Keep the oldest one (first in array since sorted by createdAt)
        const keepType = types[0];
        const removeTypes = types.slice(1);
        console.log(`   Keeping: ${keepType._id} (created: ${keepType.createdAt})`);
        removeTypes.forEach(t => {
          console.log(`   Removing: ${t._id} (created: ${t.createdAt})`);
          duplicatesToRemove.push(t._id);
        });
        console.log('');
      });

      // Step 7: Update plant types to reference the kept type, then remove duplicates
      console.log('📋 Step 7: Handling duplicate plant types...');
      // For now, just mark duplicates as inactive instead of deleting
      const removeResult = await PlantType.updateMany(
        { _id: { $in: duplicatesToRemove } },
        { $set: { isActive: false } }
      );
      console.log(`✅ Marked ${removeResult.modifiedCount} duplicate plant types as inactive\n`);
    } else {
      console.log('✅ No duplicate plant types found\n');
    }

    // Step 8: Find and remove duplicate plant varieties
    console.log('📋 Step 8: Finding duplicate plant varieties...\n');
    const allFruitVarieties = await PlantVariety.find({
      isActive: true
    }).populate('plantTypeId', 'name category');

    // Filter to only varieties whose plant type is in the fruit category
    const fruitVarieties = allFruitVarieties.filter(v => {
      const pt = v.plantTypeId;
      return pt && (
        pt.category === primaryCategory.name ||
        pt.category?.toLowerCase() === 'fruit' ||
        pt.category?.toLowerCase() === 'fruits'
      );
    });

    // Group by name (case-insensitive), plant type, and organization
    const varietiesByKey = new Map();
    fruitVarieties.forEach(v => {
      const ptId = v.plantTypeId?._id?.toString() || 'no-type';
      const key = `${v.name.toLowerCase().trim()}|${ptId}|${v.organizationId?.toString() || 'no-org'}`;
      if (!varietiesByKey.has(key)) {
        varietiesByKey.set(key, []);
      }
      varietiesByKey.get(key).push(v);
    });

    const duplicateVarieties = [];
    varietiesByKey.forEach((varieties, key) => {
      if (varieties.length > 1) {
        duplicateVarieties.push({ key, varieties });
      }
    });

    if (duplicateVarieties.length > 0) {
      console.log(`Found ${duplicateVarieties.length} duplicate variety group(s):\n`);
      let varietiesToRemove = [];
      
      duplicateVarieties.forEach(({ key, varieties }) => {
        console.log(`"${varieties[0].name}" (${varieties.length} duplicates):`);
        const keepVariety = varieties[0];
        const removeVarieties = varieties.slice(1);
        console.log(`   Keeping: ${keepVariety._id} (created: ${keepVariety.createdAt})`);
        removeVarieties.forEach(v => {
          console.log(`   Removing: ${v._id} (created: ${v.createdAt})`);
          varietiesToRemove.push(v._id);
        });
        console.log('');
      });

      const removeVarietiesResult = await PlantVariety.updateMany(
        { _id: { $in: varietiesToRemove } },
        { $set: { isActive: false } }
      );
      console.log(`✅ Marked ${removeVarietiesResult.modifiedCount} duplicate varieties as inactive\n`);
    } else {
      console.log('✅ No duplicate varieties found\n');
    }

    // Step 9: Mark other categories as inactive (don't delete to preserve history)
    if (otherCategories.length > 0) {
      console.log('📋 Step 9: Marking duplicate categories as inactive...');
      const otherCategoryIds = otherCategories.map(cat => cat._id);
      const deactivateResult = await Category.updateMany(
        { _id: { $in: otherCategoryIds } },
        { $set: { isActive: false } }
      );
      console.log(`✅ Marked ${deactivateResult.modifiedCount} duplicate categories as inactive\n`);
    }

    // Step 10: Summary
    console.log('📊 Summary:');
    console.log(`   Primary category: "${primaryCategory.name}" (${primaryCategory._id})`);
    console.log(`   Categories merged: ${otherCategories.length}`);
    console.log(`   Plant types updated: ${updateResult.modifiedCount + caseVariationUpdate.modifiedCount}`);
    console.log(`   Duplicate plant types removed: ${duplicates.length > 0 ? duplicates.reduce((sum, d) => sum + d.types.length - 1, 0) : 0}`);
    console.log(`   Duplicate varieties removed: ${duplicateVarieties.length > 0 ? duplicateVarieties.reduce((sum, d) => sum + d.varieties.length - 1, 0) : 0}`);
    console.log('');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('\n✅ Merge completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  mergeFruitsCategories();
}

module.exports = mergeFruitsCategories;
