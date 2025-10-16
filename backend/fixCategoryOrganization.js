const mongoose = require('mongoose');
const Category = require('./models/Category');
const Organization = require('./models/Organization');
require('dotenv').config();

// Connect to MongoDB
const connectDB = require('./config/database');
connectDB();

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});

async function fixCategoryOrganization() {
  try {
    console.log('🔧 Fixing category organization IDs...');

    // Get the correct organization (Sanctity Ferme)
    const organization = await Organization.findOne({ name: 'Sanctity Ferme' });
    if (!organization) {
      console.log('❌ Sanctity Ferme organization not found');
      return;
    }

    console.log(`✅ Found organization: ${organization.name} (${organization._id})`);

    // Check current categories
    console.log('\n📋 Current categories and their organizations:');
    const allCategories = await Category.find({ isActive: true }).sort({ displayName: 1 });
    allCategories.forEach(category => {
      console.log(`  ${category.emoji} ${category.displayName} (${category.name}) - Org: ${category.organizationId}`);
    });

    // Update all categories to belong to the correct organization
    console.log('\n🔄 Updating category organization IDs...');
    const updateResult = await Category.updateMany(
      { isActive: true },
      { organizationId: organization._id }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} categories`);

    // Verify the fix
    console.log('\n✅ Verification - Categories after fix:');
    const updatedCategories = await Category.find({ isActive: true }).sort({ displayName: 1 });
    updatedCategories.forEach(category => {
      console.log(`  ${category.emoji} ${category.displayName} (${category.name}) - Org: ${category.organizationId}`);
    });

    console.log('\n🎉 Category organization fix completed!');
    console.log('\n📝 Summary:');
    console.log(`- Updated ${updateResult.modifiedCount} categories`);
    console.log(`- All categories now belong to: ${organization.name}`);
    console.log('- Users should now see all categories in the dropdown');

  } catch (error) {
    console.error('❌ Error fixing category organization:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix function
fixCategoryOrganization();
