const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Domain = require('../models/Domain');
const Plant = require('../models/Plant');

async function removeInactiveSF3Plants() {
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

    // Count inactive plants first
    const inactiveCount = await Plant.countDocuments({ 
      domainId: domain._id,
      isActive: false 
    });

    if (inactiveCount === 0) {
      console.log('\n✅ No inactive plants found in SF3 domain. Nothing to remove.');
      await mongoose.connection.close();
      return;
    }

    console.log(`\n⚠️  Found ${inactiveCount} inactive plants in SF3 domain.`);

    // Get some sample inactive plants to show what will be deleted
    const sampleInactive = await Plant.find({ 
      domainId: domain._id,
      isActive: false 
    }).limit(10).select('name type plotId').populate('plotId', 'name');

    console.log('\n📋 Sample inactive plants to be removed:');
    sampleInactive.forEach((plant, index) => {
      const plotName = plant.plotId ? plant.plotId.name : 'Unknown Plot';
      console.log(`   ${index + 1}. ${plant.name} (${plant.type}) - ${plotName}`);
    });

    if (inactiveCount > 10) {
      console.log(`   ... and ${inactiveCount - 10} more`);
    }

    // Delete inactive plants
    const result = await Plant.deleteMany({ 
      domainId: domain._id,
      isActive: false 
    });

    console.log(`\n✅ Successfully removed ${result.deletedCount} inactive plants from SF3 domain.`);

    // Show final count
    const finalActiveCount = await Plant.countDocuments({ 
      domainId: domain._id,
      isActive: true 
    });
    console.log(`\n📊 Remaining active plants in SF3 domain: ${finalActiveCount}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error removing inactive SF3 plants:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
removeInactiveSF3Plants();

