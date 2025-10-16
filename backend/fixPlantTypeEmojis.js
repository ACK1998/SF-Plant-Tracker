const mongoose = require('mongoose');
const PlantType = require('./models/PlantType');

async function fixPlantTypeEmojis() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas database');

    console.log('\n=== FIXING PLANT TYPE EMOJIS ===');
    
    // Define specific emojis for each plant type
    const specificEmojis = {
      // Vegetables
      'Tomato': '🍅',
      'Lettuce': '🥬',
      'Carrot': '🥕',
      'Cucumber': '🥒',
      
      // Herbs
      'Basil': '🌿',
      'Mint': '🌱',
      'Rosemary': '🌿',
      'Thyme': '🌿',
      'Sage': '🌿',
      'Lavender': '💜',
      
      // Fruits
      'Strawberry': '🍓',
      'Blueberry': '🫐',
      'Apple': '🍎',
      'Cherry': '🍒',
      'Lemon': '🍋',
      'Orange': '🍊',
      'Peach': '🍑',
      'Pear': '🍐',
      'Plum': '🫐',
      'Jackfruit': '🍈',
      
      // Grains
      'Wheat': '🌾',
      
      // Legumes
      'Bean': '🫘',
      'Pea': '🫛'
    };

    // Update plant types with specific emojis
    console.log('\n🔄 Updating plant type emojis...');
    let updatedCount = 0;
    
    for (const [plantName, correctEmoji] of Object.entries(specificEmojis)) {
      const plantType = await PlantType.findOne({ name: plantName });
      if (plantType) {
        const oldEmoji = plantType.emoji;
        
        await PlantType.findByIdAndUpdate(plantType._id, {
          emoji: correctEmoji
        });
        
        console.log(`✅ ${plantName}: ${oldEmoji} → ${correctEmoji}`);
        updatedCount++;
      } else {
        console.log(`❌ Plant type not found: ${plantName}`);
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} plant type emojis!`);

    // Show final results grouped by category
    console.log('\n=== FINAL PLANT TYPES WITH CORRECT EMOJIS ===');
    const plantTypes = await PlantType.find({}).select('name category emoji').sort('category');
    
    const groupedByCategory = {};
    plantTypes.forEach(type => {
      if (!groupedByCategory[type.category]) {
        groupedByCategory[type.category] = [];
      }
      groupedByCategory[type.category].push(type);
    });

    Object.entries(groupedByCategory).forEach(([category, types]) => {
      console.log(`\n${category.toUpperCase()}:`);
      types.forEach(type => {
        console.log(`  - ${type.name} ${type.emoji}`);
      });
    });

    await mongoose.connection.close();
    console.log('\n✅ Plant type emojis fixed!');
  } catch (error) {
    console.error('❌ Error fixing plant type emojis:', error);
  }
}

fixPlantTypeEmojis();
