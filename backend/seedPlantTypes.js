const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const PlantType = require('./models/PlantType');
const PlantVariety = require('./models/PlantVariety');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Comprehensive plant data from Wikipedia and agricultural sources
const plantData = [
  {
    category: 'vegetable',
    types: [
      {
        name: 'Tomato',
        emoji: '🍅',
        description: 'A popular fruit vegetable, technically a berry, widely cultivated for its edible fruit.',
        growingSeason: 'Spring to Fall',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Roma', description: 'Plum tomato, excellent for sauces and canning', characteristics: { color: 'Red', size: 'Medium' }, growingInfo: { daysToMaturity: 75, height: '3-4 ft', spacing: '24-36 inches' } },
          { name: 'Cherry', description: 'Small, sweet tomatoes perfect for salads', characteristics: { color: 'Red', size: 'Small' }, growingInfo: { daysToMaturity: 65, height: '4-6 ft', spacing: '18-24 inches' } },
          { name: 'Beefsteak', description: 'Large, meaty tomatoes for slicing', characteristics: { color: 'Red', size: 'Large' }, growingInfo: { daysToMaturity: 85, height: '5-7 ft', spacing: '36-48 inches' } },
          { name: 'Heirloom', description: 'Traditional varieties with unique flavors and colors', characteristics: { color: 'Various', size: 'Medium-Large' }, growingInfo: { daysToMaturity: 80, height: '4-6 ft', spacing: '30-36 inches' } }
        ]
      },
      {
        name: 'Lettuce',
        emoji: '🥬',
        description: 'A leafy green vegetable, commonly used in salads and sandwiches.',
        growingSeason: 'Spring and Fall',
        sunRequirement: 'Partial Sun',
        waterRequirement: 'High',
        varieties: [
          { name: 'Romaine', description: 'Crisp, elongated leaves with a mild flavor', characteristics: { color: 'Green', size: 'Large' }, growingInfo: { daysToMaturity: 70, height: '8-12 inches', spacing: '12-18 inches' } },
          { name: 'Butterhead', description: 'Soft, buttery leaves that form loose heads', characteristics: { color: 'Light Green', size: 'Medium' }, growingInfo: { daysToMaturity: 65, height: '6-8 inches', spacing: '12 inches' } },
          { name: 'Iceberg', description: 'Crisp, compact heads with mild flavor', characteristics: { color: 'Pale Green', size: 'Large' }, growingInfo: { daysToMaturity: 75, height: '8-10 inches', spacing: '12-18 inches' } },
          { name: 'Red Leaf', description: 'Red-tinted leaves with a slightly bitter taste', characteristics: { color: 'Red-Green', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '6-10 inches', spacing: '12 inches' } }
        ]
      },
      {
        name: 'Carrot',
        emoji: '🥕',
        description: 'A root vegetable, usually orange in color, though purple, black, red, white, and yellow varieties exist.',
        growingSeason: 'Spring and Fall',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Nantes', description: 'Cylindrical, sweet carrots with smooth texture', characteristics: { color: 'Orange', size: 'Medium' }, growingInfo: { daysToMaturity: 65, height: '6-8 inches', spacing: '2-3 inches' } },
          { name: 'Danvers', description: 'Classic tapered carrots, good for storage', characteristics: { color: 'Orange', size: 'Large' }, growingInfo: { daysToMaturity: 75, height: '8-10 inches', spacing: '3-4 inches' } },
          { name: 'Chantenay', description: 'Short, stout carrots with broad shoulders', characteristics: { color: 'Orange', size: 'Small' }, growingInfo: { daysToMaturity: 70, height: '4-6 inches', spacing: '2-3 inches' } },
          { name: 'Purple Dragon', description: 'Purple-skinned carrots with orange flesh', characteristics: { color: 'Purple', size: 'Medium' }, growingInfo: { daysToMaturity: 70, height: '6-8 inches', spacing: '3 inches' } }
        ]
      },
      {
        name: 'Cucumber',
        emoji: '🥒',
        description: 'A creeping vine plant that bears cucumiform fruits, which are used as vegetables.',
        growingSeason: 'Summer',
        sunRequirement: 'Full Sun',
        waterRequirement: 'High',
        varieties: [
          { name: 'English', description: 'Long, seedless cucumbers with thin skin', characteristics: { color: 'Dark Green', size: 'Long' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '12-18 inches' } },
          { name: 'Pickling', description: 'Small, crisp cucumbers perfect for pickling', characteristics: { color: 'Green', size: 'Small' }, growingInfo: { daysToMaturity: 50, height: 'Vining', spacing: '12 inches' } },
          { name: 'Lemon', description: 'Round, yellow cucumbers with mild flavor', characteristics: { color: 'Yellow', size: 'Small' }, growingInfo: { daysToMaturity: 65, height: 'Vining', spacing: '18 inches' } },
          { name: 'Armenian', description: 'Long, ribbed cucumbers with mild taste', characteristics: { color: 'Light Green', size: 'Long' }, growingInfo: { daysToMaturity: 70, height: 'Vining', spacing: '18-24 inches' } }
        ]
      }
    ]
  },
  {
    category: 'herb',
    types: [
      {
        name: 'Basil',
        emoji: '🌿',
        description: 'A culinary herb of the family Lamiaceae, native to tropical regions from central Africa to Southeast Asia.',
        growingSeason: 'Spring to Fall',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Sweet Basil', description: 'Classic Italian basil with large, aromatic leaves', characteristics: { color: 'Green', size: 'Medium' }, growingInfo: { daysToMaturity: 30, height: '12-24 inches', spacing: '12 inches' } },
          { name: 'Thai Basil', description: 'Spicy basil with purple stems and anise flavor', characteristics: { color: 'Green-Purple', size: 'Medium' }, growingInfo: { daysToMaturity: 35, height: '18-24 inches', spacing: '12 inches' } },
          { name: 'Lemon Basil', description: 'Citrus-scented basil with bright flavor', characteristics: { color: 'Light Green', size: 'Small' }, growingInfo: { daysToMaturity: 30, height: '12-18 inches', spacing: '10 inches' } },
          { name: 'Purple Basil', description: 'Dark purple leaves with strong basil flavor', characteristics: { color: 'Purple', size: 'Medium' }, growingInfo: { daysToMaturity: 35, height: '12-20 inches', spacing: '12 inches' } }
        ]
      },
      {
        name: 'Mint',
        emoji: '🌱',
        description: 'A perennial herb with fragrant, toothed leaves and tiny purple, pink, or white flowers.',
        growingSeason: 'Spring to Fall',
        sunRequirement: 'Partial Sun',
        waterRequirement: 'High',
        varieties: [
          { name: 'Peppermint', description: 'Classic mint with strong, cooling flavor', characteristics: { color: 'Dark Green', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '12-24 inches', spacing: '18 inches' } },
          { name: 'Spearmint', description: 'Milder mint flavor, great for cooking', characteristics: { color: 'Green', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '12-24 inches', spacing: '18 inches' } },
          { name: 'Chocolate Mint', description: 'Mint with chocolate undertones', characteristics: { color: 'Dark Green', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '12-20 inches', spacing: '18 inches' } },
          { name: 'Apple Mint', description: 'Fruity mint with apple-like aroma', characteristics: { color: 'Light Green', size: 'Large' }, growingInfo: { daysToMaturity: 60, height: '18-30 inches', spacing: '24 inches' } }
        ]
      },
      {
        name: 'Rosemary',
        emoji: '🌿',
        description: 'A woody, perennial herb with fragrant, evergreen, needle-like leaves and white, pink, purple, or blue flowers.',
        growingSeason: 'Year-round',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Low',
        varieties: [
          { name: 'Tuscan Blue', description: 'Upright rosemary with blue flowers', characteristics: { color: 'Dark Green', size: 'Large' }, growingInfo: { daysToMaturity: 90, height: '3-6 ft', spacing: '24-36 inches' } },
          { name: 'Prostrate', description: 'Trailing rosemary for ground cover', characteristics: { color: 'Green', size: 'Medium' }, growingInfo: { daysToMaturity: 90, height: '6-12 inches', spacing: '18-24 inches' } },
          { name: 'Arp', description: 'Cold-hardy rosemary variety', characteristics: { color: 'Green', size: 'Medium' }, growingInfo: { daysToMaturity: 90, height: '2-4 ft', spacing: '24 inches' } },
          { name: 'Gorizia', description: 'Large-leaved rosemary with strong flavor', characteristics: { color: 'Green', size: 'Large' }, growingInfo: { daysToMaturity: 90, height: '3-5 ft', spacing: '30 inches' } }
        ]
      },
      {
        name: 'Thyme',
        emoji: '🌿',
        description: 'A low-growing woody perennial, cultivated as a culinary herb.',
        growingSeason: 'Spring to Fall',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Low',
        varieties: [
          { name: 'Common Thyme', description: 'Classic culinary thyme with gray-green leaves', characteristics: { color: 'Gray-Green', size: 'Small' }, growingInfo: { daysToMaturity: 75, height: '6-12 inches', spacing: '12 inches' } },
          { name: 'Lemon Thyme', description: 'Thyme with citrus aroma and flavor', characteristics: { color: 'Green', size: 'Small' }, growingInfo: { daysToMaturity: 75, height: '6-12 inches', spacing: '12 inches' } },
          { name: 'Creeping Thyme', description: 'Low-growing thyme for ground cover', characteristics: { color: 'Green', size: 'Small' }, growingInfo: { daysToMaturity: 75, height: '2-4 inches', spacing: '8-12 inches' } },
          { name: 'Caraway Thyme', description: 'Thyme with caraway seed flavor', characteristics: { color: 'Green', size: 'Small' }, growingInfo: { daysToMaturity: 75, height: '6-10 inches', spacing: '12 inches' } }
        ]
      }
    ]
  },
  {
    category: 'fruit',
    types: [
      {
        name: 'Strawberry',
        emoji: '🍓',
        description: 'A widely grown hybrid species of the genus Fragaria, known for its sweet, red, heart-shaped fruits.',
        growingSeason: 'Spring to Summer',
        sunRequirement: 'Full Sun',
        waterRequirement: 'High',
        varieties: [
          { name: 'June-bearing', description: 'Traditional strawberries that fruit in early summer', characteristics: { color: 'Red', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '6-8 inches', spacing: '18 inches' } },
          { name: 'Everbearing', description: 'Strawberries that fruit throughout the growing season', characteristics: { color: 'Red', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '6-8 inches', spacing: '18 inches' } },
          { name: 'Day-neutral', description: 'Strawberries that fruit regardless of day length', characteristics: { color: 'Red', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '6-8 inches', spacing: '18 inches' } },
          { name: 'Alpine', description: 'Small, intensely flavored strawberries', characteristics: { color: 'Red', size: 'Small' }, growingInfo: { daysToMaturity: 60, height: '4-6 inches', spacing: '12 inches' } }
        ]
      },
      {
        name: 'Blueberry',
        emoji: '🫐',
        description: 'Perennial flowering plants with blue or purple berries, classified in the section Cyanococcus within the genus Vaccinium.',
        growingSeason: 'Summer',
        sunRequirement: 'Full Sun',
        waterRequirement: 'High',
        varieties: [
          { name: 'Highbush', description: 'Large, sweet berries on tall bushes', characteristics: { color: 'Blue', size: 'Large' }, growingInfo: { daysToMaturity: 90, height: '4-8 ft', spacing: '4-6 ft' } },
          { name: 'Lowbush', description: 'Small, wild-type blueberries', characteristics: { color: 'Blue', size: 'Small' }, growingInfo: { daysToMaturity: 90, height: '1-2 ft', spacing: '2-3 ft' } },
          { name: 'Rabbiteye', description: 'Southern variety with large, firm berries', characteristics: { color: 'Blue', size: 'Large' }, growingInfo: { daysToMaturity: 90, height: '6-10 ft', spacing: '6-8 ft' } },
          { name: 'Half-high', description: 'Compact bushes with medium-sized berries', characteristics: { color: 'Blue', size: 'Medium' }, growingInfo: { daysToMaturity: 90, height: '2-4 ft', spacing: '3-4 ft' } }
        ]
      },
      {
        name: 'Raspberry',
        emoji: '🫐',
        description: 'Edible fruits of a multitude of plant species in the genus Rubus of the rose family.',
        growingSeason: 'Summer to Fall',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Red Raspberry', description: 'Classic red raspberries with sweet-tart flavor', characteristics: { color: 'Red', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '4-6 ft', spacing: '2-3 ft' } },
          { name: 'Black Raspberry', description: 'Dark purple-black berries with unique flavor', characteristics: { color: 'Black', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '4-6 ft', spacing: '2-3 ft' } },
          { name: 'Golden Raspberry', description: 'Yellow-gold berries with mild, sweet flavor', characteristics: { color: 'Yellow', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '4-6 ft', spacing: '2-3 ft' } },
          { name: 'Purple Raspberry', description: 'Hybrid with purple berries and complex flavor', characteristics: { color: 'Purple', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: '4-6 ft', spacing: '2-3 ft' } }
        ]
      }
    ]
  },
  {
    category: 'tree',
    types: [
      {
        name: 'Apple',
        emoji: '🍎',
        description: 'A deciduous tree in the rose family best known for its sweet, pomaceous fruit.',
        growingSeason: 'Spring to Fall',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Gala', description: 'Sweet, crisp apples with red-orange skin', characteristics: { color: 'Red-Orange', size: 'Medium' }, growingInfo: { daysToMaturity: 150, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Granny Smith', description: 'Tart green apples, excellent for cooking', characteristics: { color: 'Green', size: 'Large' }, growingInfo: { daysToMaturity: 160, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Honeycrisp', description: 'Sweet, juicy apples with crisp texture', characteristics: { color: 'Red-Yellow', size: 'Large' }, growingInfo: { daysToMaturity: 170, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Fuji', description: 'Sweet, firm apples with long storage life', characteristics: { color: 'Red-Yellow', size: 'Large' }, growingInfo: { daysToMaturity: 180, height: '15-20 ft', spacing: '15-20 ft' } }
        ]
      },
      {
        name: 'Cherry',
        emoji: '🍒',
        description: 'A fruit of the genus Prunus, produced by a limited number of species.',
        growingSeason: 'Spring to Summer',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Bing', description: 'Large, dark red sweet cherries', characteristics: { color: 'Dark Red', size: 'Large' }, growingInfo: { daysToMaturity: 90, height: '20-30 ft', spacing: '20-25 ft' } },
          { name: 'Rainier', description: 'Yellow-red sweet cherries with mild flavor', characteristics: { color: 'Yellow-Red', size: 'Large' }, growingInfo: { daysToMaturity: 90, height: '20-30 ft', spacing: '20-25 ft' } },
          { name: 'Montmorency', description: 'Tart cherries perfect for pies and preserves', characteristics: { color: 'Red', size: 'Medium' }, growingInfo: { daysToMaturity: 90, height: '20-30 ft', spacing: '20-25 ft' } },
          { name: 'Stella', description: 'Self-pollinating sweet cherry variety', characteristics: { color: 'Dark Red', size: 'Large' }, growingInfo: { daysToMaturity: 90, height: '20-30 ft', spacing: '20-25 ft' } }
        ]
      },
      {
        name: 'Peach',
        emoji: '🍑',
        description: 'A deciduous tree native to the region of Northwest China between the Tarim Basin and the north slopes of the Kunlun Mountains.',
        growingSeason: 'Summer',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Elberta', description: 'Classic yellow-fleshed peaches', characteristics: { color: 'Yellow', size: 'Large' }, growingInfo: { daysToMaturity: 120, height: '15-25 ft', spacing: '20-25 ft' } },
          { name: 'White Peach', description: 'White-fleshed peaches with mild flavor', characteristics: { color: 'White', size: 'Medium' }, growingInfo: { daysToMaturity: 110, height: '15-25 ft', spacing: '20-25 ft' } },
          { name: 'Donut Peach', description: 'Flat, donut-shaped peaches with sweet flavor', characteristics: { color: 'Yellow', size: 'Medium' }, growingInfo: { daysToMaturity: 115, height: '15-25 ft', spacing: '20-25 ft' } },
          { name: 'Nectarine', description: 'Smooth-skinned peaches with firm flesh', characteristics: { color: 'Yellow', size: 'Medium' }, growingInfo: { daysToMaturity: 120, height: '15-25 ft', spacing: '20-25 ft' } }
        ]
      }
    ]
  },
  {
    category: 'grain',
    types: [
      {
        name: 'Wheat',
        emoji: '🌾',
        description: 'A grass widely cultivated for its seed, a cereal grain which is a worldwide staple food.',
        growingSeason: 'Fall to Summer',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Hard Red Winter', description: 'High-protein wheat for bread making', characteristics: { color: 'Golden', size: 'Medium' }, growingInfo: { daysToMaturity: 240, height: '2-4 ft', spacing: '1-2 inches' } },
          { name: 'Soft White', description: 'Low-protein wheat for pastries and cakes', characteristics: { color: 'Golden', size: 'Medium' }, growingInfo: { daysToMaturity: 240, height: '2-4 ft', spacing: '1-2 inches' } },
          { name: 'Durum', description: 'Hard wheat for pasta and semolina', characteristics: { color: 'Golden', size: 'Medium' }, growingInfo: { daysToMaturity: 240, height: '2-4 ft', spacing: '1-2 inches' } },
          { name: 'Spelt', description: 'Ancient wheat with nutty flavor', characteristics: { color: 'Golden', size: 'Medium' }, growingInfo: { daysToMaturity: 240, height: '2-4 ft', spacing: '1-2 inches' } }
        ]
      },
      {
        name: 'Corn',
        emoji: '🌽',
        description: 'A cereal grain first domesticated by indigenous peoples in Mexico about 10,000 years ago.',
        growingSeason: 'Spring to Fall',
        sunRequirement: 'Full Sun',
        waterRequirement: 'High',
        varieties: [
          { name: 'Sweet Corn', description: 'Sweet, tender corn for fresh eating', characteristics: { color: 'Yellow', size: 'Large' }, growingInfo: { daysToMaturity: 70, height: '6-8 ft', spacing: '12 inches' } },
          { name: 'Popcorn', description: 'Hard kernels that pop when heated', characteristics: { color: 'Yellow', size: 'Medium' }, growingInfo: { daysToMaturity: 100, height: '6-8 ft', spacing: '12 inches' } },
          { name: 'Dent Corn', description: 'Field corn for animal feed and processing', characteristics: { color: 'Yellow', size: 'Large' }, growingInfo: { daysToMaturity: 110, height: '6-8 ft', spacing: '12 inches' } },
          { name: 'Flint Corn', description: 'Hard-kerneled corn for grinding', characteristics: { color: 'Various', size: 'Medium' }, growingInfo: { daysToMaturity: 100, height: '6-8 ft', spacing: '12 inches' } }
        ]
      }
    ]
  },
  {
    category: 'legume',
    types: [
      {
        name: 'Bean',
        emoji: '🫘',
        description: 'A seed of one of several genera of the flowering plant family Fabaceae.',
        growingSeason: 'Spring to Fall',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Green Bean', description: 'Tender pods eaten fresh or cooked', characteristics: { color: 'Green', size: 'Medium' }, growingInfo: { daysToMaturity: 55, height: 'Vining/Bush', spacing: '4-6 inches' } },
          { name: 'Kidney Bean', description: 'Red beans for soups and chili', characteristics: { color: 'Red', size: 'Medium' }, growingInfo: { daysToMaturity: 90, height: 'Vining/Bush', spacing: '4-6 inches' } },
          { name: 'Black Bean', description: 'Small black beans with rich flavor', characteristics: { color: 'Black', size: 'Small' }, growingInfo: { daysToMaturity: 85, height: 'Vining/Bush', spacing: '4-6 inches' } },
          { name: 'Pinto Bean', description: 'Speckled beans popular in Mexican cuisine', characteristics: { color: 'Pink-Brown', size: 'Medium' }, growingInfo: { daysToMaturity: 90, height: 'Vining/Bush', spacing: '4-6 inches' } }
        ]
      },
      {
        name: 'Pea',
        emoji: '🫛',
        description: 'Most commonly the small spherical seed or the seed-pod of the flowering plant species Pisum sativum.',
        growingSeason: 'Spring and Fall',
        sunRequirement: 'Full Sun',
        waterRequirement: 'Moderate',
        varieties: [
          { name: 'Garden Pea', description: 'Traditional shelling peas', characteristics: { color: 'Green', size: 'Small' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '2-3 inches' } },
          { name: 'Snow Pea', description: 'Flat pods eaten whole', characteristics: { color: 'Green', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '2-3 inches' } },
          { name: 'Snap Pea', description: 'Plump pods eaten whole', characteristics: { color: 'Green', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '2-3 inches' } },
          { name: 'Sugar Pea', description: 'Sweet peas with edible pods', characteristics: { color: 'Green', size: 'Medium' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '2-3 inches' } }
        ]
      }
    ]
  }
];

async function seedPlantTypes() {
  try {
    console.log('🌱 Starting plant types and varieties seeding...');

    // Clear existing data
    await PlantType.deleteMany({});
    await PlantVariety.deleteMany({});
    console.log('🗑️  Cleared existing plant types and varieties');

    // Create plant types and varieties
    for (const categoryData of plantData) {
      for (const typeData of categoryData.types) {
        // Create plant type
        const plantType = new PlantType({
          name: typeData.name,
          category: categoryData.category,
          emoji: typeData.emoji,
          description: typeData.description,
          growingSeason: typeData.growingSeason,
          sunRequirement: typeData.sunRequirement,
          waterRequirement: typeData.waterRequirement,
          isActive: true,
          createdBy: '689220c1596aee3de42045d1', // Existing user ID
          organizationId: '689220c1596aee3de42045d3' // Existing organization ID
        });

        const savedPlantType = await plantType.save();
        console.log(`✅ Created plant type: ${typeData.name}`);

        // Create varieties for this type
        for (const varietyData of typeData.varieties) {
          const plantVariety = new PlantVariety({
            name: varietyData.name,
            plantTypeId: savedPlantType._id,
            plantTypeName: typeData.name,
            description: varietyData.description,
            characteristics: varietyData.characteristics,
            growingInfo: varietyData.growingInfo,
                      isActive: true,
          isDefault: false,
          createdBy: '689220c1596aee3de42045d1', // Existing user ID
          organizationId: '689220c1596aee3de42045d3' // Existing organization ID
          });

          await plantVariety.save();
          console.log(`  🌿 Created variety: ${varietyData.name}`);
        }
      }
    }

    console.log('🎉 Plant types and varieties seeding completed successfully!');
    console.log(`📊 Created ${plantData.reduce((sum, cat) => sum + cat.types.length, 0)} plant types`);
    console.log(`🌱 Created ${plantData.reduce((sum, cat) => sum + cat.types.reduce((tSum, type) => tSum + type.varieties.length, 0), 0)} plant varieties`);

  } catch (error) {
    console.error('❌ Error seeding plant types and varieties:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
seedPlantTypes();
