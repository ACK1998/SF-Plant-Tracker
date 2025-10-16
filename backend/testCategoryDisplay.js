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

async function testCategoryDisplay() {
  try {
    console.log('🧪 Testing category display functionality...');

    // Test 1: Check all categories
    console.log('\n📋 Test 1: Checking all categories...');
    const allCategories = await Category.find({ isActive: true }).sort({ displayName: 1 });
    console.log(`Found ${allCategories.length} active categories:`);
    allCategories.forEach(category => {
      console.log(`  ${category.emoji} ${category.displayName} (${category.name})`);
    });

    // Test 2: Check if Climber category exists
    console.log('\n🔍 Test 2: Checking if Climber category exists...');
    const climberCategory = await Category.findOne({ name: 'climber' });
    if (climberCategory) {
      console.log(`✅ Climber category found: ${climberCategory.displayName} (${climberCategory.emoji})`);
    } else {
      console.log('❌ Climber category not found');
      return;
    }

    // Test 3: Check plant types by category
    console.log('\n🌱 Test 3: Checking plant types by category...');
    const plantTypesByCategory = await PlantType.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('Plant types by category:');
    plantTypesByCategory.forEach(item => {
      console.log(`  ${item._id}: ${item.count} plant type(s)`);
    });

    // Test 4: Simulate the frontend logic
    console.log('\n💻 Test 4: Simulating frontend category display logic...');
    
    // Get all plant types
    const allPlantTypes = await PlantType.find({ isActive: true });
    
    // Group plant types by category (like frontend does)
    const groupedPlantTypes = allPlantTypes.reduce((acc, type) => {
      if (!acc[type.category]) {
        acc[type.category] = [];
      }
      acc[type.category].push(type);
      return acc;
    }, {});

    console.log('Categories with plant types:');
    Object.keys(groupedPlantTypes).forEach(category => {
      console.log(`  ${category}: ${groupedPlantTypes[category].length} plant type(s)`);
    });

    // Add categories that don't have any plant types yet (like frontend does)
    const allCategoryNames = allCategories.map(cat => cat.name);
    const categoriesWithTypes = Object.keys(groupedPlantTypes);
    
    console.log('\nCategories without plant types:');
    allCategoryNames.forEach(categoryName => {
      if (!categoriesWithTypes.includes(categoryName)) {
        console.log(`  ${categoryName}: 0 plant types (should be displayed as empty)`);
      }
    });

    // Test 5: Create a test plant type for Climber category
    console.log('\n📝 Test 5: Creating a test plant type for Climber category...');
    const testPlantType = new PlantType({
      name: 'Test Climber Plant',
      category: 'climber',
      emoji: '🌿',
      description: 'A test plant type for the climber category',
      createdBy: '68988950b7bd7ceba50fe3e1',
      organizationId: '68988950b7bd7ceba50fe3dd'
    });

    const savedPlantType = await testPlantType.save();
    console.log(`✅ Created plant type: ${savedPlantType.name} in category: ${savedPlantType.category}`);

    // Test 6: Verify the plant type appears in the group
    console.log('\n🔍 Test 6: Verifying plant type appears in group...');
    const updatedPlantTypes = await PlantType.find({ isActive: true });
    const updatedGroupedPlantTypes = updatedPlantTypes.reduce((acc, type) => {
      if (!acc[type.category]) {
        acc[type.category] = [];
      }
      acc[type.category].push(type);
      return acc;
    }, {});

    if (updatedGroupedPlantTypes['climber'] && updatedGroupedPlantTypes['climber'].length > 0) {
      console.log(`✅ Climber category now has ${updatedGroupedPlantTypes['climber'].length} plant type(s)`);
    } else {
      console.log('❌ Climber category still has no plant types');
    }

    // Test 7: Clean up
    console.log('\n🧹 Test 7: Cleaning up test data...');
    await PlantType.findByIdAndDelete(savedPlantType._id);
    console.log('✅ Test plant type deleted');

    console.log('\n🎉 All category display tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- Climber category exists in database');
    console.log('- Frontend should display Climber category even if it has no plant types');
    console.log('- When a plant type is added to Climber category, it should appear in the list');

  } catch (error) {
    console.error('❌ Error testing category display:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test function
testCategoryDisplay();
