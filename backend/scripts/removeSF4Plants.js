const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plant = require('../models/Plant');
const Domain = require('../models/Domain');

async function removeSF4Plants() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the SF4 domain
    const domain = await Domain.findOne({ name: 'SF4' });
    if (!domain) {
      throw new Error('SF4 domain not found.');
    }
    console.log('✅ Found domain:', domain.name, `(${domain._id})`);

    // Count existing plants
    const plantCount = await Plant.countDocuments({
      domainId: domain._id,
      isActive: true
    });
    console.log(`\n📊 Found ${plantCount} active plants in SF4 domain`);

    if (plantCount === 0) {
      console.log('✅ No plants to remove.');
      await mongoose.connection.close();
      return;
    }

    // Remove all plants in SF4 domain
    const result = await Plant.deleteMany({
      domainId: domain._id,
      isActive: true
    });

    console.log(`\n✅ Removed ${result.deletedCount} plants from SF4 domain`);

    // Verify removal
    const remainingCount = await Plant.countDocuments({
      domainId: domain._id,
      isActive: true
    });
    console.log(`   Remaining active plants: ${remainingCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Script completed!');
  } catch (error) {
    console.error('❌ Error removing SF4 plants:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
removeSF4Plants();

