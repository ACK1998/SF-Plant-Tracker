const mongoose = require('mongoose');
const Category = require('./models/Category');
const User = require('./models/User');
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

async function testCategoryFiltering() {
  try {
    console.log('🧪 Testing category filtering by organization...');

    // Test 1: Check all categories in the database
    console.log('\n📋 Test 1: Checking all categories in database...');
    const allCategories = await Category.find({ isActive: true }).sort({ displayName: 1 });
    console.log(`Found ${allCategories.length} total active categories:`);
    allCategories.forEach(category => {
      console.log(`  ${category.emoji} ${category.displayName} (${category.name}) - Org: ${category.organizationId}`);
    });

    // Test 2: Check organizations
    console.log('\n🏢 Test 2: Checking organizations...');
    const organizations = await Organization.find({}).sort({ name: 1 });
    console.log(`Found ${organizations.length} organizations:`);
    organizations.forEach(org => {
      console.log(`  ${org.name} (${org._id})`);
    });

    // Test 3: Check users and their organizations
    console.log('\n👥 Test 3: Checking users and their organizations...');
    const users = await User.find({}).populate('organizationId').sort({ firstName: 1 });
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  ${user.firstName} ${user.lastName} (${user.role}) - Org: ${user.organizationId?.name || 'None'} (${user.organizationId?._id || 'None'})`);
    });

    // Test 4: Simulate filtering for different user roles
    console.log('\n🔍 Test 4: Simulating category filtering for different user roles...');
    
    // Get the first organization
    const firstOrg = organizations[0];
    if (!firstOrg) {
      console.log('❌ No organizations found');
      return;
    }

    // Get a super admin user
    const superAdmin = users.find(u => u.role === 'super_admin');
    if (superAdmin) {
      console.log(`\nSuper Admin (${superAdmin.firstName} ${superAdmin.lastName}):`);
      const superAdminCategories = await Category.find({ 
        isActive: true,
        // Super admin can see all categories
      }).sort({ displayName: 1 });
      console.log(`  Can see ${superAdminCategories.length} categories:`);
      superAdminCategories.forEach(cat => {
        console.log(`    ${cat.emoji} ${cat.displayName} (${cat.name})`);
      });
    }

    // Get an org admin user
    const orgAdmin = users.find(u => u.role === 'org_admin');
    if (orgAdmin) {
      console.log(`\nOrg Admin (${orgAdmin.firstName} ${orgAdmin.lastName}):`);
      const orgAdminCategories = await Category.find({ 
        isActive: true,
        organizationId: orgAdmin.organizationId?._id || orgAdmin.organizationId
      }).sort({ displayName: 1 });
      console.log(`  Can see ${orgAdminCategories.length} categories:`);
      orgAdminCategories.forEach(cat => {
        console.log(`    ${cat.emoji} ${cat.displayName} (${cat.name})`);
      });
    }

    // Test 5: Check categories by organization
    console.log('\n🏢 Test 5: Checking categories by organization...');
    for (const org of organizations) {
      const orgCategories = await Category.find({ 
        isActive: true,
        organizationId: org._id
      }).sort({ displayName: 1 });
      
      console.log(`\nOrganization: ${org.name} (${org._id})`);
      console.log(`  Has ${orgCategories.length} categories:`);
      orgCategories.forEach(cat => {
        console.log(`    ${cat.emoji} ${cat.displayName} (${cat.name})`);
      });
    }

    console.log('\n🎉 Category filtering test completed!');
    console.log('\n📝 Summary:');
    console.log('- Check if categories are properly distributed across organizations');
    console.log('- Verify that users can see categories from their organization');
    console.log('- Ensure super admin can see all categories');

  } catch (error) {
    console.error('❌ Error testing category filtering:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test function
testCategoryFiltering();
