const mongoose = require('mongoose');
const PlantType = require('./models/PlantType');

async function checkPlantData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas database');

    console.log('\n=== CHECKING PLANT DATA ===');
    
    // Check planttypes collection
    console.log('\n🌿 PLANT TYPES:');
    const plantTypes = await PlantType.find({}).select('_id name category emoji description organizationId isActive createdAt');
    console.log(`Total plant types: ${plantTypes.length}`);
    
    if (plantTypes.length === 0) {
      console.log('❌ No plant types found');
    } else {
      plantTypes.forEach((type, index) => {
        console.log(`${index + 1}. ${type.name} (${type.category})`);
        console.log(`   ID: ${type._id}`);
        console.log(`   Emoji: ${type.emoji}`);
        console.log(`   Active: ${type.isActive}`);
        console.log(`   Created: ${type.createdAt}`);
        console.log('');
      });
    }

    // Check plantvarieties collection directly
    console.log('\n🍃 PLANT VARIETIES:');
    const varieties = await mongoose.connection.db.collection('plantvarieties').find({}).toArray();
    console.log(`Total plant varieties: ${varieties.length}`);
    
    if (varieties.length === 0) {
      console.log('❌ No plant varieties found');
    } else {
      varieties.slice(0, 5).forEach((variety, index) => {
        console.log(`${index + 1}. ${variety.name || 'No name'} (${variety.category || 'No category'})`);
        console.log(`   ID: ${variety._id}`);
        console.log(`   Plant Type: ${variety.plantTypeId || 'No plant type'}`);
        console.log(`   Active: ${variety.isActive !== false ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      if (varieties.length > 5) {
        console.log(`... and ${varieties.length - 5} more varieties`);
      }
    }

    // Check if there are any plant types in the varieties that should be in planttypes
    console.log('\n🔍 ANALYZING VARIETIES FOR MISSING TYPES:');
    const uniqueTypes = new Set();
    varieties.forEach(variety => {
      if (variety.plantTypeId) {
        uniqueTypes.add(variety.plantTypeId.toString());
      }
    });
    
    console.log(`Unique plant type IDs in varieties: ${uniqueTypes.size}`);
    uniqueTypes.forEach(typeId => {
      console.log(`  - ${typeId}`);
    });

    // Check if these types exist in planttypes collection
    console.log('\n🔍 CHECKING IF TYPES EXIST IN PLANTTYPES:');
    for (const typeId of uniqueTypes) {
      const exists = await PlantType.findById(typeId);
      console.log(`Type ${typeId}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    // Check plants collection
    console.log('\n🌱 PLANTS:');
    const plants = await mongoose.connection.db.collection('plants').find({}).toArray();
    console.log(`Total plants: ${plants.length}`);
    
    if (plants.length > 0) {
      plants.slice(0, 3).forEach((plant, index) => {
        console.log(`${index + 1}. ${plant.name || 'No name'} (${plant.type || 'No type'})`);
        console.log(`   ID: ${plant._id}`);
        console.log(`   Category: ${plant.category || 'No category'}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Plant data check completed!');
  } catch (error) {
    console.error('❌ Error checking plant data:', error);
  }
}

checkPlantData();
