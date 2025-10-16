const mongoose = require('mongoose');
const PlantType = require('./models/PlantType');

async function fixPlantTypeCategories() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas database');

    console.log('\n=== FIXING PLANT TYPE CATEGORIES ===');
    
    // Get all varieties to analyze categories
    const varieties = await mongoose.connection.db.collection('plantvarieties').find({}).toArray();
    console.log(`📊 Found ${varieties.length} plant varieties`);

    // Analyze what categories exist in varieties
    const categoryAnalysis = {};
    varieties.forEach(variety => {
      if (variety.category) {
        categoryAnalysis[variety.category] = (categoryAnalysis[variety.category] || 0) + 1;
      }
    });

    console.log('\n📋 Categories found in varieties:');
    Object.entries(categoryAnalysis).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} varieties`);
    });

    // Define proper category mapping based on plant names
    const categoryMapping = {
      'Tomato': 'vegetable',
      'Lettuce': 'vegetable',
      'Carrot': 'vegetable',
      'Cucumber': 'vegetable',
      'Basil': 'herb',
      'Mint': 'herb',
      'Rosemary': 'herb',
      'Thyme': 'herb',
      'Sage': 'herb',
      'Lavender': 'herb',
      'Strawberry': 'fruit',
      'Blueberry': 'fruit',
      'Apple': 'fruit',
      'Cherry': 'fruit',
      'Lemon': 'fruit',
      'Orange': 'fruit',
      'Peach': 'fruit',
      'Pear': 'fruit',
      'Plum': 'fruit',
      'Jackfruit': 'fruit',
      'Wheat': 'grain',
      'Bean': 'legume',
      'Pea': 'legume'
    };

    // Update plant types with correct categories
    console.log('\n🔄 Updating plant type categories...');
    let updatedCount = 0;
    
    for (const [plantName, correctCategory] of Object.entries(categoryMapping)) {
      const plantType = await PlantType.findOne({ name: plantName });
      if (plantType) {
        const oldCategory = plantType.category;
        const newEmoji = getEmojiForCategory(correctCategory);
        
        await PlantType.findByIdAndUpdate(plantType._id, {
          category: correctCategory,
          emoji: newEmoji
        });
        
        console.log(`✅ ${plantName}: ${oldCategory} → ${correctCategory} ${newEmoji}`);
        updatedCount++;
      } else {
        console.log(`❌ Plant type not found: ${plantName}`);
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} plant type categories!`);

    // Show final results
    console.log('\n=== FINAL PLANT TYPES ===');
    const plantTypes = await PlantType.find({}).select('name category emoji').sort('category');
    
    const groupedByCategory = {};
    plantTypes.forEach(type => {
      if (!groupedByCategory[type.category]) {
        groupedByCategory[type.category] = [];
      }
      groupedByCategory[type.category].push(type);
    });

    Object.entries(groupedByCategory).forEach(([category, types]) => {
      console.log(`\n${getEmojiForCategory(category)} ${category.toUpperCase()}:`);
      types.forEach(type => {
        console.log(`  - ${type.name} ${type.emoji}`);
      });
    });

    await mongoose.connection.close();
    console.log('\n✅ Plant type categories fixed!');
  } catch (error) {
    console.error('❌ Error fixing plant type categories:', error);
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

fixPlantTypeCategories();
