const mongoose = require('mongoose');
const PlantType = require('./models/PlantType');
const Organization = require('./models/Organization');

async function fixPlantTypes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas database');

    console.log('\n=== FIXING MISSING PLANT TYPES ===');
    
    // Get organization
    const organization = await Organization.findOne({});
    if (!organization) {
      console.log('❌ No organization found. Please run setupDatabase.js first.');
      return;
    }
    console.log('✅ Found organization:', organization.name);

    // Get all varieties
    const varieties = await mongoose.connection.db.collection('plantvarieties').find({}).toArray();
    console.log(`📊 Found ${varieties.length} plant varieties`);

    // Group varieties by plant type ID
    const typeGroups = {};
    varieties.forEach(variety => {
      if (variety.plantTypeId) {
        const typeId = variety.plantTypeId.toString();
        if (!typeGroups[typeId]) {
          typeGroups[typeId] = [];
        }
        typeGroups[typeId].push(variety);
      }
    });

    console.log(`🔍 Found ${Object.keys(typeGroups).length} unique plant type IDs`);

    // Create plant types from the first variety of each group
    let createdCount = 0;
    for (const [typeId, typeVarieties] of Object.entries(typeGroups)) {
      const firstVariety = typeVarieties[0];
      
      // Check if plant type already exists
      const existingType = await PlantType.findById(typeId);
      if (existingType) {
        console.log(`✅ Plant type ${firstVariety.plantTypeName || 'Unknown'} already exists`);
        continue;
      }

      // Create new plant type
      const plantTypeData = {
        _id: new mongoose.Types.ObjectId(typeId),
        name: firstVariety.plantTypeName || `Plant Type ${typeId.slice(-6)}`,
        category: firstVariety.category || 'vegetable',
        emoji: getEmojiForCategory(firstVariety.category || 'vegetable'),
        description: `Plant type for ${firstVariety.plantTypeName || 'various plants'}`,
        organizationId: organization._id,
        createdBy: organization.createdBy,
        isActive: true
      };

      try {
        const newPlantType = await PlantType.create(plantTypeData);
        console.log(`✅ Created plant type: ${newPlantType.name} (${newPlantType.category})`);
        createdCount++;
      } catch (error) {
        console.log(`❌ Failed to create plant type ${plantTypeData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} plant types!`);

    // Verify the fix
    console.log('\n=== VERIFICATION ===');
    const totalPlantTypes = await PlantType.countDocuments({});
    console.log(`Total plant types now: ${totalPlantTypes}`);

    // Show some examples
    const sampleTypes = await PlantType.find({}).limit(5).select('name category emoji');
    console.log('\n📋 Sample plant types:');
    sampleTypes.forEach(type => {
      console.log(`  - ${type.name} (${type.category}) ${type.emoji}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Plant types fix completed!');
  } catch (error) {
    console.error('❌ Error fixing plant types:', error);
  }
}

function getEmojiForCategory(category) {
  const emojiMap = {
    'vegetable': '🥕',
    'fruit': '🍎',
    'herb': '🌿',
    'tree': '🌳',
    'flower': '🌸',
    'grain': '🌾',
    'legume': '🫘',
    'root': '🥔',
    'leafy': '🥬',
    'default': '🌱'
  };
  
  return emojiMap[category.toLowerCase()] || emojiMap.default;
}

fixPlantTypes();
