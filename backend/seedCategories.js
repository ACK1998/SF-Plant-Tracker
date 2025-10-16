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

// Default categories data
const defaultCategories = [
  {
    name: 'vegetable',
    displayName: 'Vegetables',
    emoji: '🥬',
    description: 'Edible plants that are typically grown for their leaves, stems, roots, or flowers',
    color: '#22c55e',
    isDefault: true
  },
  {
    name: 'herb',
    displayName: 'Herbs',
    emoji: '🌿',
    description: 'Aromatic plants used for flavoring, medicine, or fragrance',
    color: '#16a34a',
    isDefault: true
  },
  {
    name: 'fruit',
    displayName: 'Fruits',
    emoji: '🍎',
    description: 'Sweet or sour edible products of trees or other plants',
    color: '#f59e0b',
    isDefault: true
  },
  {
    name: 'tree',
    displayName: 'Trees',
    emoji: '🌳',
    description: 'Perennial woody plants with a single main stem or trunk',
    color: '#15803d',
    isDefault: true
  },
  {
    name: 'grain',
    displayName: 'Grains',
    emoji: '🌾',
    description: 'Grasses cultivated for their edible seeds',
    color: '#d97706',
    isDefault: true
  },
  {
    name: 'legume',
    displayName: 'Legumes',
    emoji: '🫘',
    description: 'Plants in the pea family that produce pods with seeds',
    color: '#dc2626',
    isDefault: true
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Starting categories seeding...');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    // Create default categories
    for (const categoryData of defaultCategories) {
      const category = new Category({
        ...categoryData,
        createdBy: '689220c1596aee3de42045d1', // Existing user ID
        organizationId: '689220c1596aee3de42045d3' // Existing organization ID
      });

      await category.save();
      console.log(`✅ Created category: ${categoryData.displayName} (${categoryData.name})`);
    }

    console.log('🎉 Categories seeding completed successfully!');
    console.log(`📊 Created ${defaultCategories.length} default categories`);

    // Display created categories
    const createdCategories = await Category.find({}).sort({ displayName: 1 });
    console.log('\n📋 Created categories:');
    createdCategories.forEach(category => {
      console.log(`  ${category.emoji} ${category.displayName} (${category.name})`);
    });

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding function
seedCategories();
