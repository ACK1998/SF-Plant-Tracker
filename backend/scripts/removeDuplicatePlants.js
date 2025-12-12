const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Domain = require('../models/Domain');
const Plot = require('../models/Plot');
const Plant = require('../models/Plant');

async function removeDuplicatePlants() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the SF3 domain
    const domain = await Domain.findOne({ name: 'SF3' });
    if (!domain) {
      throw new Error('SF3 domain not found.');
    }
    console.log('✅ Found domain: SF3');

    // Find Plot 15 in SF3
    const plot15 = await Plot.findOne({ 
      name: 'Plot 15',
      domainId: domain._id 
    });
    
    if (!plot15) {
      console.log('⚠️  Plot 15 not found in SF3. Checking all plots for duplicates...');
    } else {
      console.log(`✅ Found Plot 15: ${plot15._id}`);
    }

    // Get all plots in SF3 domain
    const allPlots = await Plot.find({ 
      domainId: domain._id,
      isActive: true 
    });
    console.log(`\n📋 Found ${allPlots.length} plots in SF3 domain`);

    let totalDuplicatesRemoved = 0;
    let totalPlotsChecked = 0;
    let plotsWithDuplicates = [];

    // Check each plot for duplicates
    for (const plot of allPlots) {
      totalPlotsChecked++;
      
      // Find all active plants in this plot
      const plants = await Plant.find({
        plotId: plot._id,
        isActive: true
      }).sort({ createdAt: 1 }); // Sort by creation date (oldest first)

      if (plants.length === 0) {
        continue;
      }

      // Group plants by name
      const plantsByName = {};
      plants.forEach(plant => {
        const name = plant.name.trim();
        if (!plantsByName[name]) {
          plantsByName[name] = [];
        }
        plantsByName[name].push(plant);
      });

      // Find duplicates (same name appears more than once)
      const duplicates = [];
      for (const [name, plantList] of Object.entries(plantsByName)) {
        if (plantList.length > 1) {
          duplicates.push({ name, plants: plantList });
        }
      }

      if (duplicates.length > 0) {
        plotsWithDuplicates.push({
          plotName: plot.name,
          plotId: plot._id,
          duplicates: duplicates
        });

        console.log(`\n🔍 Plot "${plot.name}" (${plot._id}):`);
        console.log(`   Total plants: ${plants.length}`);
        console.log(`   Duplicate groups found: ${duplicates.length}`);

        // Remove duplicates (keep the oldest one, delete the rest)
        for (const duplicate of duplicates) {
          const { name, plants: duplicatePlants } = duplicate;
          console.log(`   \n   📌 Duplicate name: "${name}" (${duplicatePlants.length} instances)`);
          
          // Sort by createdAt to keep the oldest
          duplicatePlants.sort((a, b) => {
            const dateA = a.createdAt || a.plantedDate || new Date(0);
            const dateB = b.createdAt || b.plantedDate || new Date(0);
            return dateA - dateB;
          });

          // Keep the first (oldest) one, delete the rest
          const toKeep = duplicatePlants[0];
          const toDelete = duplicatePlants.slice(1);

          console.log(`      ✅ Keeping: ${toKeep._id} (created: ${toKeep.createdAt || toKeep.plantedDate})`);
          
          for (const plantToDelete of toDelete) {
            console.log(`      ❌ Deleting: ${plantToDelete._id} (created: ${plantToDelete.createdAt || plantToDelete.plantedDate})`);
            
            // Delete the plant
            await Plant.findByIdAndDelete(plantToDelete._id);
            totalDuplicatesRemoved++;
          }
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total plots checked: ${totalPlotsChecked}`);
    console.log(`Plots with duplicates: ${plotsWithDuplicates.length}`);
    console.log(`Total duplicate plants removed: ${totalDuplicatesRemoved}`);

    if (plotsWithDuplicates.length > 0) {
      console.log('\n📋 Plots with duplicates found:');
      plotsWithDuplicates.forEach(({ plotName, duplicates }) => {
        console.log(`   - ${plotName}: ${duplicates.length} duplicate group(s)`);
      });
    }

    // Specifically check Plot 15 if it exists
    if (plot15) {
      const plot15Plants = await Plant.find({
        plotId: plot15._id,
        isActive: true
      });
      console.log(`\n✅ Plot 15 now has ${plot15Plants.length} active plants`);
      
      // Show remaining plants in Plot 15
      const plot15ByName = {};
      plot15Plants.forEach(plant => {
        const name = plant.name.trim();
        if (!plot15ByName[name]) {
          plot15ByName[name] = [];
        }
        plot15ByName[name].push(plant);
      });
      
      const remainingDuplicates = Object.entries(plot15ByName)
        .filter(([name, plants]) => plants.length > 1);
      
      if (remainingDuplicates.length > 0) {
        console.log(`⚠️  Warning: Plot 15 still has ${remainingDuplicates.length} duplicate group(s):`);
        remainingDuplicates.forEach(([name, plants]) => {
          console.log(`   - "${name}": ${plants.length} instances`);
        });
      } else {
        console.log('✅ Plot 15 has no remaining duplicates');
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Error removing duplicate plants:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
removeDuplicatePlants();

