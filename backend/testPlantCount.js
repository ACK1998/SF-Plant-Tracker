const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Plant = require('./models/Plant');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = require('./config/database');
connectDB();

async function testPlantCount() {
  try {
    console.log('🧪 Testing Plant Count for Application Users...');
    console.log('');

    // Get total count of all plants in the organization
    const totalPlants = await Plant.countDocuments({ isActive: true });
    console.log(`📊 Total plants in database: ${totalPlants}`);

    // Get organization ID (assuming all plants are in the same org for this test)
    const samplePlant = await Plant.findOne({ isActive: true });
    if (!samplePlant) {
      console.log('❌ No plants found in database');
      return;
    }

    const organizationId = samplePlant.organizationId;
    console.log(`🏢 Organization ID: ${organizationId}`);

    // Count plants by organization
    const plantsInOrg = await Plant.countDocuments({ 
      isActive: true, 
      organizationId: organizationId 
    });
    console.log(`🌱 Plants in organization: ${plantsInOrg}`);

    // Get an application user
    const appUser = await User.findOne({ 
      role: 'application_user', 
      isActive: true,
      organizationId: organizationId
    });

    if (!appUser) {
      console.log('❌ No application user found in this organization');
      return;
    }

    console.log(`👤 Application User: ${appUser.firstName} ${appUser.lastName}`);
    console.log(`   Plot: ${appUser.plotId}`);
    console.log(`   Domain: ${appUser.domainId}`);
    console.log('');

    // Test the filter that would be applied for application users
    const filter = { 
      isActive: true,
      organizationId: appUser.organizationId
    };

    const plantsForAppUser = await Plant.find(filter);
    console.log(`🔍 Plants returned for application user: ${plantsForAppUser.length}`);
    console.log('');

    // Show some sample plants
    console.log('📋 Sample plants:');
    plantsForAppUser.slice(0, 5).forEach((plant, index) => {
      console.log(`   ${index + 1}. ${plant.name} (Plot: ${plant.plotId})`);
    });

    if (plantsForAppUser.length > 5) {
      console.log(`   ... and ${plantsForAppUser.length - 5} more`);
    }

    console.log('');
    console.log('✅ Test completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testPlantCount();
