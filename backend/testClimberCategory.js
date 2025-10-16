const mongoose = require('mongoose');
const Category = require('./models/Category');
const PlantType = require('./models/PlantType');
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

async function testClimberCategory() {
  try {
    console.log('🧪 Testing Climber category functionality...');

    // Test 1: Check if Climber category exists
    console.log('\n📋 Test 1: Checking if Climber category exists...');
    const climberCategory = await Category.findOne({ name: 'climber' });
    if (climberCategory) {
      console.log(`✅ Climber category found: ${climberCategory.displayName} (${climberCategory.emoji})`);
    } else {
      console.log('❌ Climber category not found');
      return;
    }

    // Test 2: Create a plant type with Climber category
    console.log('\n📝 Test 2: Creating a plant type with Climber category...');
    const testPlantType = new PlantType({
      name: 'Test Climber Plant',
      category: 'climber',
      emoji: '🌿',
      description: 'A test plant type for the climber category',
      createdBy: '68988950b7bd7ceba50fe3e1', // Super Admin ID
      organizationId: '68988950b7bd7ceba50fe3dd' // Organization ID
    });

    const savedPlantType = await testPlantType.save();
    console.log(`✅ Created plant type: ${savedPlantType.name} in category: ${savedPlantType.category}`);

    // Test 3: Verify the plant type was created correctly
    console.log('\n🔍 Test 3: Verifying plant type creation...');
    const retrievedPlantType = await PlantType.findById(savedPlantType._id);
    if (retrievedPlantType && retrievedPlantType.category === 'climber') {
      console.log(`✅ Plant type verified: ${retrievedPlantType.name} in category: ${retrievedPlantType.category}`);
    } else {
      console.log('❌ Plant type verification failed');
    }

    // Test 4: Check all categories in the system
    console.log('\n📊 Test 4: Checking all categories in the system...');
    const allCategories = await Category.find({ isActive: true }).sort({ displayName: 1 });
    console.log(`Found ${allCategories.length} active categories:`);
    allCategories.forEach(category => {
      console.log(`  ${category.emoji} ${category.displayName} (${category.name})`);
    });

    // Test 5: Check plant types by category
    console.log('\n🌱 Test 5: Checking plant types by category...');
    const plantTypesByCategory = await PlantType.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('Plant types by category:');
    plantTypesByCategory.forEach(item => {
      console.log(`  ${item._id}: ${item.count} plant type(s)`);
    });

    // Test 6: Clean up - delete the test plant type
    console.log('\n🧹 Test 6: Cleaning up test data...');
    await PlantType.findByIdAndDelete(savedPlantType._id);
    console.log('✅ Test plant type deleted');

    console.log('\n🎉 All Climber category tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Climber category:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test function
testClimberCategory();
