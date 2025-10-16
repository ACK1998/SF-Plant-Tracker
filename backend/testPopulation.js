const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sanctity-ferme', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');
const Organization = require('./models/Organization');

async function testPopulation() {
  try {
    console.log('Testing population...');
    
    // Test 1: Check if organizations exist
    const orgs = await Organization.find({});
    console.log('Organizations found:', orgs.length);
    orgs.forEach(org => console.log(`- ${org.name} (${org._id})`));
    
    // Test 2: Check users without population
    const usersWithoutPop = await User.find({}).select('-password');
    console.log('\nUsers without population:');
    usersWithoutPop.forEach(user => {
      console.log(`- ${user.username}: organizationId = ${user.organizationId} (type: ${typeof user.organizationId})`);
    });
    
    // Test 3: Check users with population
    const usersWithPop = await User.find({})
      .select('-password')
      .populate({
        path: 'organizationId',
        select: 'name',
        model: 'Organization'
      });
    
    console.log('\nUsers with population:');
    usersWithPop.forEach(user => {
      console.log(`- ${user.username}: organizationId = ${JSON.stringify(user.organizationId)}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPopulation(); 