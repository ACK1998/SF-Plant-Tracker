const mongoose = require('mongoose');
const PlantType = require('./models/PlantType');

async function moveJackfruitToTree() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas database');

    console.log('\n=== MOVING JACKFRUIT TO TREE CATEGORY ===');
    
    // Find Jackfruit plant type
    const jackfruit = await PlantType.findOne({ name: 'Jackfruit' });
    
    if (!jackfruit) {
      console.log('❌ Jackfruit plant type not found');
      return;
    }

    console.log(`📋 Current Jackfruit: ${jackfruit.name} (${jackfruit.category}) ${jackfruit.emoji}`);

    // Update Jackfruit to tree category
    await PlantType.findByIdAndUpdate(jackfruit._id, {
      category: 'tree',
      emoji: '🍈', // Jackfruit emoji
      description: 'Tropical fruit tree'
    });

    console.log(`✅ Updated Jackfruit: ${jackfruit.name} (fruit → tree) 🍈`);

    // Update all Jackfruit varieties to tree category
    const jackfruitVarieties = await mongoose.connection.db.collection('plantvarieties').find({
      plantTypeId: jackfruit._id
    }).toArray();

    console.log(`📊 Found ${jackfruitVarieties.length} Jackfruit varieties to update`);

    for (const variety of jackfruitVarieties) {
      await mongoose.connection.db.collection('plantvarieties').updateOne(
        { _id: variety._id },
        { 
          $set: { 
            category: 'tree',
            updatedAt: new Date()
          }
        }
      );
      console.log(`  ✅ Updated variety: ${variety.name} (fruit → tree)`);
    }

    // Show final results
    console.log('\n=== FINAL TREE TYPES ===');
    const treeTypes = await PlantType.find({ category: 'tree' }).select('name emoji description').sort('name');
    treeTypes.forEach(type => {
      console.log(`  - ${type.name} ${type.emoji}: ${type.description}`);
    });

    // Count varieties by category
    const fruitVarieties = await mongoose.connection.db.collection('plantvarieties').find({ category: 'fruit' }).toArray();
    const treeVarieties = await mongoose.connection.db.collection('plantvarieties').find({ category: 'tree' }).toArray();

    console.log(`\n📊 Category Summary:`);
    console.log(`  - Fruit varieties: ${fruitVarieties.length}`);
    console.log(`  - Tree varieties: ${treeVarieties.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Jackfruit moved to tree category successfully!');
  } catch (error) {
    console.error('❌ Error moving Jackfruit:', error);
  }
}

moveJackfruitToTree();
