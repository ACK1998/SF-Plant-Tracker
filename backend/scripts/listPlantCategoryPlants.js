const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plant = require('../models/Plant');
const Plot = require('../models/Plot');
const Domain = require('../models/Domain');
const Organization = require('../models/Organization');

async function listPlantCategoryPlants() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all active plants with category='plant'
    const plants = await Plant.find({ 
      isActive: true, 
      category: 'plant' 
    })
    .populate('plotId', 'name')
    .populate('domainId', 'name')
    .populate('organizationId', 'name')
    .sort({ name: 1 });

    console.log(`📊 Found ${plants.length} plants with category='plant':\n`);
    console.log('='.repeat(80));
    
    if (plants.length === 0) {
      console.log('No plants found with category="plant"');
    } else {
      // Group by type
      const plantsByType = {};
      plants.forEach(plant => {
        const type = plant.type || 'Unknown';
        if (!plantsByType[type]) {
          plantsByType[type] = [];
        }
        plantsByType[type].push(plant);
      });

      // Display grouped by type
      Object.keys(plantsByType).sort().forEach(type => {
        const typePlants = plantsByType[type];
        console.log(`\n${type} (${typePlants.length} plant${typePlants.length > 1 ? 's' : ''}):`);
        console.log('-'.repeat(80));
        typePlants.forEach((plant, index) => {
          console.log(`  ${index + 1}. ${plant.name}`);
          console.log(`     Type: ${plant.type || 'N/A'}`);
          console.log(`     Variety: ${plant.variety || 'N/A'}`);
          console.log(`     Health: ${plant.health || 'N/A'}`);
          console.log(`     Growth Stage: ${plant.growthStage || 'N/A'}`);
          console.log(`     Plot: ${plant.plotId?.name || 'N/A'}`);
          console.log(`     Domain: ${plant.domainId?.name || 'N/A'}`);
          console.log(`     Organization: ${plant.organizationId?.name || 'N/A'}`);
          if (plant.plantedDate) {
            console.log(`     Planted: ${new Date(plant.plantedDate).toLocaleDateString()}`);
          }
          console.log('');
        });
      });

      // Summary
      console.log('='.repeat(80));
      console.log(`\n📊 Summary:`);
      console.log(`   Total plants with category='plant': ${plants.length}`);
      
      const healthyCount = plants.filter(p => p.health === 'excellent' || p.health === 'good').length;
      console.log(`   Healthy (excellent/good): ${healthyCount}`);
      console.log(`   Fair: ${plants.filter(p => p.health === 'fair').length}`);
      console.log(`   Poor: ${plants.filter(p => p.health === 'poor').length}`);
      console.log(`   Deceased: ${plants.filter(p => p.health === 'deceased').length}`);
      
      console.log(`\n📋 By Plant Type:`);
      Object.keys(plantsByType).sort().forEach(type => {
        console.log(`   ${type}: ${plantsByType[type].length}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Script completed!');
  } catch (error) {
    console.error('❌ Error listing plants:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  listPlantCategoryPlants();
}

module.exports = listPlantCategoryPlants;

