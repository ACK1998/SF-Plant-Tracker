const mongoose = require('mongoose');
const Category = require('./models/Category');
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

async function testCategories() {
  try {
    console.log('🧪 Testing categories functionality...');

    // Test 1: Fetch all categories
    console.log('\n📋 Test 1: Fetching all categories...');
    const categories = await Category.find({}).sort({ displayName: 1 });
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`  ${category.emoji} ${category.displayName} (${category.name}) - ${category.color}`);
    });

    // Test 2: Create a new category
    console.log('\n📝 Test 2: Creating a new test category...');
    const newCategory = new Category({
      name: 'test-category',
      displayName: 'Test Category',
      emoji: '🧪',
      description: 'A test category for testing purposes',
      color: '#8b5cf6',
      createdBy: '689220c1596aee3de42045d1',
      organizationId: '689220c1596aee3de42045d3'
    });

    const savedCategory = await newCategory.save();
    console.log(`✅ Created test category: ${savedCategory.displayName}`);

    // Test 3: Update the test category
    console.log('\n✏️  Test 3: Updating the test category...');
    const updatedCategory = await Category.findByIdAndUpdate(
      savedCategory._id,
      { 
        displayName: 'Updated Test Category',
        description: 'Updated description for testing'
      },
      { new: true }
    );
    console.log(`✅ Updated category: ${updatedCategory.displayName}`);

    // Test 4: Delete the test category
    console.log('\n🗑️  Test 4: Deleting the test category...');
    await Category.findByIdAndDelete(savedCategory._id);
    console.log('✅ Deleted test category');

    // Test 5: Verify deletion
    console.log('\n🔍 Test 5: Verifying deletion...');
    const deletedCategory = await Category.findById(savedCategory._id);
    if (!deletedCategory) {
      console.log('✅ Test category successfully deleted');
    } else {
      console.log('❌ Test category still exists');
    }

    // Test 6: Search categories
    console.log('\n🔍 Test 6: Searching categories...');
    const vegetableCategories = await Category.find({
      $or: [
        { name: { $regex: 'vegetable', $options: 'i' } },
        { displayName: { $regex: 'vegetable', $options: 'i' } }
      ]
    });
    console.log(`Found ${vegetableCategories.length} categories matching 'vegetable':`);
    vegetableCategories.forEach(category => {
      console.log(`  ${category.emoji} ${category.displayName}`);
    });

    console.log('\n🎉 All category tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing categories:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test function
testCategories();
