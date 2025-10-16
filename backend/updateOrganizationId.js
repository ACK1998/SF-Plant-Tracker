const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Plant = require('./models/Plant');
const User = require('./models/User');
const Plot = require('./models/Plot');
const Domain = require('./models/Domain');
const PlantType = require('./models/PlantType');
const PlantVariety = require('./models/PlantVariety');

// Organization IDs
const OLD_ORGANIZATION_ID = '68972f30af8abc96c1bb218a';
const NEW_ORGANIZATION_ID = '689220c1596aee3de42045d3';

// Connect to MongoDB
const connectDB = require('./config/database');
connectDB();

async function updateOrganizationId() {
  try {
    console.log('🔄 Starting organizationId update process...');
    console.log(`📝 Replacing organizationId: ${OLD_ORGANIZATION_ID} → ${NEW_ORGANIZATION_ID}`);
    console.log('');

    let totalUpdated = 0;

    // Update Plants
    console.log('🌱 Updating Plants...');
    const plantsResult = await Plant.updateMany(
      { organizationId: OLD_ORGANIZATION_ID },
      { $set: { organizationId: NEW_ORGANIZATION_ID } }
    );
    console.log(`   ✅ Updated ${plantsResult.modifiedCount} plants`);
    totalUpdated += plantsResult.modifiedCount;

    // Update Users (excluding super_admin users)
    console.log('👥 Updating Users...');
    const usersResult = await User.updateMany(
      { 
        organizationId: OLD_ORGANIZATION_ID,
        role: { $ne: 'super_admin' }
      },
      { $set: { organizationId: NEW_ORGANIZATION_ID } }
    );
    console.log(`   ✅ Updated ${usersResult.modifiedCount} users`);
    totalUpdated += usersResult.modifiedCount;

    // Update Plots
    console.log('📊 Updating Plots...');
    const plotsResult = await Plot.updateMany(
      { organizationId: OLD_ORGANIZATION_ID },
      { $set: { organizationId: NEW_ORGANIZATION_ID } }
    );
    console.log(`   ✅ Updated ${plotsResult.modifiedCount} plots`);
    totalUpdated += plotsResult.modifiedCount;

    // Update Domains
    console.log('🏞️ Updating Domains...');
    const domainsResult = await Domain.updateMany(
      { organizationId: OLD_ORGANIZATION_ID },
      { $set: { organizationId: NEW_ORGANIZATION_ID } }
    );
    console.log(`   ✅ Updated ${domainsResult.modifiedCount} domains`);
    totalUpdated += domainsResult.modifiedCount;

    // Update PlantTypes
    console.log('🌿 Updating PlantTypes...');
    const plantTypesResult = await PlantType.updateMany(
      { organizationId: OLD_ORGANIZATION_ID },
      { $set: { organizationId: NEW_ORGANIZATION_ID } }
    );
    console.log(`   ✅ Updated ${plantTypesResult.modifiedCount} plant types`);
    totalUpdated += plantTypesResult.modifiedCount;

    // Update PlantVarieties
    console.log('🌺 Updating PlantVarieties...');
    const plantVarietiesResult = await PlantVariety.updateMany(
      { organizationId: OLD_ORGANIZATION_ID },
      { $set: { organizationId: NEW_ORGANIZATION_ID } }
    );
    console.log(`   ✅ Updated ${plantVarietiesResult.modifiedCount} plant varieties`);
    totalUpdated += plantVarietiesResult.modifiedCount;

    console.log('');
    console.log('🎉 Update process completed successfully!');
    console.log(`📊 Total documents updated: ${totalUpdated}`);
    console.log('');
    console.log('📋 Summary:');
    console.log(`   Plants: ${plantsResult.modifiedCount}`);
    console.log(`   Users: ${usersResult.modifiedCount}`);
    console.log(`   Plots: ${plotsResult.modifiedCount}`);
    console.log(`   Domains: ${domainsResult.modifiedCount}`);
    console.log(`   PlantTypes: ${plantTypesResult.modifiedCount}`);
    console.log(`   PlantVarieties: ${plantVarietiesResult.modifiedCount}`);

    // Verify the update
    console.log('');
    console.log('🔍 Verification - Checking for any remaining old organizationId...');
    
    const remainingOld = await Promise.all([
      Plant.countDocuments({ organizationId: OLD_ORGANIZATION_ID }),
      User.countDocuments({ organizationId: OLD_ORGANIZATION_ID }),
      Plot.countDocuments({ organizationId: OLD_ORGANIZATION_ID }),
      Domain.countDocuments({ organizationId: OLD_ORGANIZATION_ID }),
      PlantType.countDocuments({ organizationId: OLD_ORGANIZATION_ID }),
      PlantVariety.countDocuments({ organizationId: OLD_ORGANIZATION_ID })
    ]);

    const totalRemaining = remainingOld.reduce((sum, count) => sum + count, 0);
    
    if (totalRemaining === 0) {
      console.log('✅ Verification passed: No documents with old organizationId found');
    } else {
      console.log(`⚠️  Warning: ${totalRemaining} documents still have the old organizationId`);
      console.log('   Plants:', remainingOld[0]);
      console.log('   Users:', remainingOld[1]);
      console.log('   Plots:', remainingOld[2]);
      console.log('   Domains:', remainingOld[3]);
      console.log('   PlantTypes:', remainingOld[4]);
      console.log('   PlantVarieties:', remainingOld[5]);
    }

  } catch (error) {
    console.error('❌ Error during update:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the update
updateOrganizationId();
