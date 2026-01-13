const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plot = require('../models/Plot');
const Domain = require('../models/Domain');
const Plant = require('../models/Plant');

async function removeMigrationStatusFromPlot43() {
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
    console.log('✅ Found domain: SF3', `(${domain._id})`);

    // Find Plot 43 (try multiple name formats)
    const plot43PossibleNames = [
      'Plot43',
      'Plot 43',
      'Plot: 43',
      'Plot:43'
    ];
    
    let plot43 = null;
    let plot43Format = null;
    
    for (const plotName of plot43PossibleNames) {
      plot43 = await Plot.findOne({ 
        name: plotName, 
        domainId: domain._id,
        isActive: true 
      });
      
      if (plot43) {
        plot43Format = plotName;
        break;
      }
    }
    
    if (!plot43) {
      throw new Error(`Plot 43 not found in SF3 domain (tried: ${plot43PossibleNames.join(', ')})`);
    }
    
    console.log(`✅ Found Plot 43: "${plot43.name}" (${plot43._id}) - matched format: "${plot43Format}"`);

    // Find all active plants in Plot 43
    const plants = await Plant.find({
      plotId: plot43._id,
      domainId: domain._id,
      isActive: true
    });

    if (plants.length === 0) {
      console.log('\n⚠️  No active plants found in Plot 43. Nothing to update.');
      await mongoose.connection.close();
      return;
    }

    console.log(`\n📊 Found ${plants.length} active plant(s) in Plot 43`);

    // Update each plant - remove the migration status history entry
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    for (const plant of plants) {
      try {
        // Check if plant has status history
        if (!plant.statusHistory || plant.statusHistory.length === 0) {
          skipped++;
          continue;
        }

        // Find the migration entry (last entry with "Moved from Plot 42" note)
        const migrationEntryIndex = plant.statusHistory.findIndex(
          entry => entry.notes && entry.notes.includes('Moved from Plot 42 to Plot 43')
        );

        if (migrationEntryIndex === -1) {
          // No migration entry found, skip
          skipped++;
          continue;
        }

        // Remove the migration entry
        plant.statusHistory.splice(migrationEntryIndex, 1);
        await plant.save();
        
        updated++;
        console.log(`✅ Removed migration status from: ${plant.name}`);
      } catch (error) {
        errors++;
        const errorMsg = `Error updating ${plant.name}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errorDetails.push({
          plant: plant.name,
          error: error.message
        });
      }
    }

    console.log(`\n✅ Update completed!`);
    console.log(`   Updated: ${updated} plants (removed migration status)`);
    console.log(`   Skipped: ${skipped} plants (no migration entry found)`);
    console.log(`   Errors: ${errors} plants`);
    
    if (errorDetails.length > 0) {
      console.log(`\n❌ Error Details:`);
      errorDetails.forEach(detail => {
        console.log(`   - ${detail.plant}: ${detail.error}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Error removing migration status from Plot 43:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
removeMigrationStatusFromPlot43();

