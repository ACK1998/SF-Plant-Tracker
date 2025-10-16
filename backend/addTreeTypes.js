const mongoose = require('mongoose');
const PlantType = require('./models/PlantType');
const Organization = require('./models/Organization');

async function addTreeTypes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas database');

    console.log('\n=== ADDING TREE TYPES AND VARIETIES ===');
    
    // Get organization
    const organization = await Organization.findOne({});
    if (!organization) {
      console.log('❌ No organization found. Please run setupDatabase.js first.');
      return;
    }
    console.log('✅ Found organization:', organization.name);

    // Define tree types with their varieties
    const treeTypes = [
      {
        name: 'Mango',
        category: 'tree',
        emoji: '🥭',
        description: 'Tropical fruit tree',
        varieties: [
          'Alphonso',
          'Dashehari',
          'Langra',
          'Chausa',
          'Totapuri',
          'Neelum',
          'Banganapalli',
          'Kesar',
          'Himsagar',
          'Amrapali'
        ]
      },
      {
        name: 'Coconut',
        category: 'tree',
        emoji: '🥥',
        description: 'Palm tree with edible fruit',
        varieties: [
          'Tall',
          'Dwarf',
          'Hybrid',
          'Malayan Dwarf',
          'West Coast Tall',
          'East Coast Tall'
        ]
      },
      {
        name: 'Banana',
        category: 'tree',
        emoji: '🍌',
        description: 'Tropical fruit tree',
        varieties: [
          'Cavendish',
          'Robusta',
          'Poovan',
          'Nendran',
          'Red Banana',
          'Lady Finger',
          'Gros Michel',
          'Plantain'
        ]
      },
      {
        name: 'Papaya',
        category: 'tree',
        emoji: '🥭',
        description: 'Tropical fruit tree',
        varieties: [
          'Solo',
          'Hawaiian',
          'Mexican',
          'Red Lady',
          'Tainung',
          'Sunrise',
          'Sunset'
        ]
      },
      {
        name: 'Guava',
        category: 'tree',
        emoji: '🍐',
        description: 'Tropical fruit tree',
        varieties: [
          'Allahabad Safeda',
          'Lucknow 49',
          'Apple Guava',
          'Strawberry Guava',
          'Pineapple Guava',
          'Red Guava',
          'White Guava'
        ]
      },
      {
        name: 'Pomegranate',
        category: 'tree',
        emoji: '🍎',
        description: 'Fruit tree with edible seeds',
        varieties: [
          'Bhagwa',
          'Ganesh',
          'Arakta',
          'Ruby',
          'Wonderful',
          'Mridula',
          'Phule Arakta'
        ]
      },
      {
        name: 'Lemon',
        category: 'tree',
        emoji: '🍋',
        description: 'Citrus fruit tree',
        varieties: [
          'Eureka',
          'Lisbon',
          'Meyer',
          'Ponderosa',
          'Villa Franca',
          'Genoa',
          'Fino'
        ]
      },
      {
        name: 'Orange',
        category: 'tree',
        emoji: '🍊',
        description: 'Citrus fruit tree',
        varieties: [
          'Navel',
          'Valencia',
          'Blood Orange',
          'Mandarin',
          'Clementine',
          'Tangerine',
          'Seville'
        ]
      },
      {
        name: 'Apple',
        category: 'tree',
        emoji: '🍎',
        description: 'Temperate fruit tree',
        varieties: [
          'Red Delicious',
          'Golden Delicious',
          'Granny Smith',
          'Fuji',
          'Gala',
          'McIntosh',
          'Honeycrisp',
          'Pink Lady'
        ]
      },
      {
        name: 'Peach',
        category: 'tree',
        emoji: '🍑',
        description: 'Stone fruit tree',
        varieties: [
          'Elberta',
          'Redhaven',
          'Belle of Georgia',
          'Reliance',
          'Contender',
          'Cresthaven',
          'Hale Haven'
        ]
      }
    ];

    // Create tree types and their varieties
    let createdTypes = 0;
    let createdVarieties = 0;

    for (const treeData of treeTypes) {
      // Check if tree type already exists
      let treeType = await PlantType.findOne({ name: treeData.name });
      
      if (!treeType) {
        // Create new tree type
        treeType = await PlantType.create({
          name: treeData.name,
          category: treeData.category,
          emoji: treeData.emoji,
          description: treeData.description,
          organizationId: organization._id,
          createdBy: organization.createdBy,
          isActive: true
        });
        console.log(`✅ Created tree type: ${treeType.name} ${treeType.emoji}`);
        createdTypes++;
      } else {
        console.log(`ℹ️ Tree type already exists: ${treeType.name} ${treeType.emoji}`);
      }

      // Add varieties for this tree type
      for (const varietyName of treeData.varieties) {
        // Check if variety already exists
        const existingVariety = await mongoose.connection.db.collection('plantvarieties').findOne({
          name: varietyName,
          plantTypeId: treeType._id
        });

        if (!existingVariety) {
          // Create new variety
          await mongoose.connection.db.collection('plantvarieties').insertOne({
            name: varietyName,
            category: treeData.category,
            plantTypeId: treeType._id,
            plantTypeName: treeData.name,
            description: `${varietyName} variety of ${treeData.name}`,
            organizationId: organization._id,
            createdBy: organization.createdBy,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`  ✅ Added variety: ${varietyName}`);
          createdVarieties++;
        } else {
          console.log(`  ℹ️ Variety already exists: ${varietyName}`);
        }
      }
    }

    console.log(`\n🎉 Successfully created ${createdTypes} tree types and ${createdVarieties} varieties!`);

    // Show final results
    console.log('\n=== FINAL TREE TYPES ===');
    const treeTypesList = await PlantType.find({ category: 'tree' }).select('name emoji description');
    treeTypesList.forEach(type => {
      console.log(`  - ${type.name} ${type.emoji}: ${type.description}`);
    });

    // Count total varieties for trees
    const treeVarieties = await mongoose.connection.db.collection('plantvarieties').find({
      category: 'tree'
    }).toArray();
    console.log(`\n📊 Total tree varieties: ${treeVarieties.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Tree types and varieties added successfully!');
  } catch (error) {
    console.error('❌ Error adding tree types:', error);
  }
}

addTreeTypes();
