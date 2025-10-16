const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Plant = require('./models/Plant');
const PlantType = require('./models/PlantType');

async function investigateDataLoss() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas database');

    console.log('\n=== INVESTIGATING DATA LOSS ===');
    
    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Check each collection for data
    console.log('\n📊 Data in each collection:');
    
    // Users
    const users = await User.find({}).select('_id username email role createdAt updatedAt');
    console.log(`\n👥 Users: ${users.length} records`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user._id}) - Created: ${user.createdAt}`);
    });

    // Organizations
    const organizations = await Organization.find({}).select('_id name description createdAt updatedAt');
    console.log(`\n🏢 Organizations: ${organizations.length} records`);
    organizations.forEach(org => {
      console.log(`  - ${org.name} (${org._id}) - Created: ${org.createdAt}`);
    });

    // Plants
    const plants = await Plant.find({}).select('_id name type createdAt updatedAt');
    console.log(`\n🌱 Plants: ${plants.length} records`);
    plants.forEach(plant => {
      console.log(`  - ${plant.name} (${plant._id}) - Created: ${plant.createdAt}`);
    });

    // Plant Types
    const plantTypes = await PlantType.find({}).select('_id name category createdAt updatedAt');
    console.log(`\n🌿 Plant Types: ${plantTypes.length} records`);
    plantTypes.forEach(type => {
      console.log(`  - ${type.name} (${type._id}) - Created: ${type.createdAt}`);
    });

    // Check for the old user ID that was in the JWT token
    console.log('\n🔍 Looking for old user ID: 68973b38780926e491302733');
    const oldUser = await User.findById('68973b38780926e491302733');
    console.log('Old user exists:', oldUser ? 'YES' : 'NO');

    // Check database stats
    console.log('\n📈 Database Statistics:');
    const stats = await mongoose.connection.db.stats();
    console.log(`  - Database name: ${stats.db}`);
    console.log(`  - Collections: ${stats.collections}`);
    console.log(`  - Data size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`  - Storage size: ${(stats.storageSize / 1024).toFixed(2)} KB`);

    // Check if there are any deleted documents (if using soft deletes)
    console.log('\n🗑️ Checking for soft-deleted documents:');
    const deletedUsers = await User.find({ isActive: false });
    console.log(`  - Soft-deleted users: ${deletedUsers.length}`);
    
    const deletedPlants = await Plant.find({ isActive: false });
    console.log(`  - Soft-deleted plants: ${deletedPlants.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Investigation completed!');
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

investigateDataLoss();
