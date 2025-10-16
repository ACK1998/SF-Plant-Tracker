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

// Helper function to check if user can edit a plant (same as in routes)
const canEditPlant = (user, plant) => {
  // Super admin can edit any plant
  if (user.role === 'super_admin') return true;
  
  // Org admin can edit any plant in their organization
  if (user.role === 'org_admin' && plant.organizationId.toString() === user.organizationId.toString()) return true;
  
  // Domain admin can edit any plant in their domain
  if (user.role === 'domain_admin' && 
      plant.organizationId.toString() === user.organizationId.toString() &&
      plant.domainId.toString() === user.domainId.toString()) return true;
  
  // Application user can only edit plants in their assigned plot
  if (user.role === 'application_user' && 
      plant.organizationId.toString() === user.organizationId.toString() &&
      plant.plotId.toString() === user.plotId.toString()) return true;
  
  return false;
};

async function testPlantPermissions() {
  try {
    console.log('🧪 Testing Plant Permission System...');
    console.log('');

    // Get some sample users of different roles
    const users = await User.find({ isActive: true }).limit(5);
    
    if (users.length === 0) {
      console.log('❌ No users found for testing');
      return;
    }

    // Get some sample plants
    const plants = await Plant.find({ isActive: true }).limit(10);
    
    if (plants.length === 0) {
      console.log('❌ No plants found for testing');
      return;
    }

    console.log(`👥 Testing with ${users.length} users`);
    console.log(`🌱 Testing with ${plants.length} plants`);
    console.log('');

    // Test each user's permissions on each plant
    for (const user of users) {
      console.log(`🔍 Testing User: ${user.firstName} ${user.lastName} (${user.role})`);
      console.log(`   Organization: ${user.organizationId}`);
      console.log(`   Domain: ${user.domainId || 'N/A'}`);
      console.log(`   Plot: ${user.plotId || 'N/A'}`);
      
      let editableCount = 0;
      let viewableCount = 0;
      
      for (const plant of plants) {
        const canEdit = canEditPlant(user, plant);
        const canView = user.role === 'super_admin' || plant.organizationId.toString() === user.organizationId?.toString();
        
        if (canEdit) editableCount++;
        if (canView) viewableCount++;
        
        console.log(`   Plant: ${plant.name} - View: ${canView ? '✅' : '❌'}, Edit: ${canEdit ? '✅' : '❌'}`);
      }
      
      console.log(`   📊 Summary: ${viewableCount} viewable, ${editableCount} editable`);
      console.log('');
    }

    // Test specific scenarios
    console.log('🎯 Testing Specific Scenarios:');
    
    // Find an application user
    const appUser = users.find(u => u.role === 'application_user');
    if (appUser) {
      console.log(`\n👤 Application User: ${appUser.firstName} ${appUser.lastName}`);
      
      // Find plants in their plot vs other plots
      const plantsInUserPlot = plants.filter(p => p.plotId.toString() === appUser.plotId.toString());
      const plantsInOtherPlots = plants.filter(p => p.plotId.toString() !== appUser.plotId.toString() && p.organizationId.toString() === appUser.organizationId?.toString());
      
      console.log(`   Plants in user's plot: ${plantsInUserPlot.length}`);
      console.log(`   Plants in other plots (same org): ${plantsInOtherPlots.length}`);
      
      // Test permissions
      plantsInUserPlot.forEach(plant => {
        const canEdit = canEditPlant(appUser, plant);
        console.log(`   ✅ Plant "${plant.name}" in user's plot - Editable: ${canEdit}`);
      });
      
      plantsInOtherPlots.forEach(plant => {
        const canEdit = canEditPlant(appUser, plant);
        console.log(`   ❌ Plant "${plant.name}" in other plot - Editable: ${canEdit}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testPlantPermissions();
