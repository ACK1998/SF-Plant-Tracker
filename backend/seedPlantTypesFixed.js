const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const PlantType = require('./models/PlantType');
const PlantVariety = require('./models/PlantVariety');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Comprehensive plant data with correct enum values
const plantData = [
  {
    category: 'vegetable',
    types: [
      {
        name: 'Tomato',
        emoji: '🍅',
        description: 'A popular fruit vegetable, technically a berry, widely cultivated for its edible fruit.',
        growingSeason: 'spring',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Roma', description: 'Plum tomato, excellent for sauces and canning', characteristics: { color: 'Red', size: 'medium' }, growingInfo: { daysToMaturity: 75, height: '3-4 ft', spacing: '24-36 inches' } },
          { name: 'Cherry', description: 'Small, sweet tomatoes perfect for salads', characteristics: { color: 'Red', size: 'small' }, growingInfo: { daysToMaturity: 65, height: '4-6 ft', spacing: '18-24 inches' } },
          { name: 'Beefsteak', description: 'Large, meaty tomatoes for slicing', characteristics: { color: 'Red', size: 'large' }, growingInfo: { daysToMaturity: 85, height: '5-7 ft', spacing: '36-48 inches' } },
          { name: 'Heirloom', description: 'Traditional varieties with unique flavors and colors', characteristics: { color: 'Various', size: 'medium' }, growingInfo: { daysToMaturity: 80, height: '4-6 ft', spacing: '30-36 inches' } },
          { name: 'Nadan', description: 'Traditional Indian tomato variety with excellent taste', characteristics: { color: 'Red', size: 'medium' }, growingInfo: { daysToMaturity: 75, height: '3-4 ft', spacing: '24-36 inches' } }
        ]
      },
      {
        name: 'Lettuce',
        emoji: '🥬',
        description: 'A leafy green vegetable, commonly used in salads and sandwiches.',
        growingSeason: 'spring',
        sunRequirement: 'partial-sun',
        waterRequirement: 'high',
        varieties: [
          { name: 'Romaine', description: 'Crisp, elongated leaves with a mild flavor', characteristics: { color: 'Green', size: 'large' }, growingInfo: { daysToMaturity: 70, height: '8-12 inches', spacing: '12-18 inches' } },
          { name: 'Butterhead', description: 'Soft, buttery leaves that form loose heads', characteristics: { color: 'Light Green', size: 'medium' }, growingInfo: { daysToMaturity: 65, height: '6-8 inches', spacing: '12 inches' } },
          { name: 'Iceberg', description: 'Crisp, compact heads with mild flavor', characteristics: { color: 'Pale Green', size: 'large' }, growingInfo: { daysToMaturity: 75, height: '8-10 inches', spacing: '12-18 inches' } },
          { name: 'Red Leaf', description: 'Red-tinted leaves with a slightly bitter taste', characteristics: { color: 'Red-Green', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: '6-10 inches', spacing: '12 inches' } }
        ]
      },
      {
        name: 'Carrot',
        emoji: '🥕',
        description: 'A root vegetable, usually orange in color, though purple, black, red, white, and yellow varieties exist.',
        growingSeason: 'spring',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Nantes', description: 'Cylindrical, sweet carrots with smooth texture', characteristics: { color: 'Orange', size: 'medium' }, growingInfo: { daysToMaturity: 65, height: '6-8 inches', spacing: '2-3 inches' } },
          { name: 'Danvers', description: 'Classic tapered carrots, good for storage', characteristics: { color: 'Orange', size: 'large' }, growingInfo: { daysToMaturity: 75, height: '8-10 inches', spacing: '3-4 inches' } },
          { name: 'Chantenay', description: 'Short, stout carrots with broad shoulders', characteristics: { color: 'Orange', size: 'small' }, growingInfo: { daysToMaturity: 70, height: '4-6 inches', spacing: '2-3 inches' } },
          { name: 'Purple Dragon', description: 'Purple-skinned carrots with orange flesh', characteristics: { color: 'Purple', size: 'medium' }, growingInfo: { daysToMaturity: 70, height: '6-8 inches', spacing: '3 inches' } }
        ]
      },
      {
        name: 'Cucumber',
        emoji: '🥒',
        description: 'A creeping vine plant that bears cucumiform fruits, which are used as vegetables.',
        growingSeason: 'summer',
        sunRequirement: 'full-sun',
        waterRequirement: 'high',
        varieties: [
          { name: 'English', description: 'Long, seedless cucumbers with thin skin', characteristics: { color: 'Dark Green', size: 'large' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '12-18 inches' } },
          { name: 'Pickling', description: 'Small, crisp cucumbers perfect for pickling', characteristics: { color: 'Green', size: 'small' }, growingInfo: { daysToMaturity: 50, height: 'Vining', spacing: '12 inches' } },
          { name: 'Lemon', description: 'Round, yellow cucumbers with mild flavor', characteristics: { color: 'Yellow', size: 'small' }, growingInfo: { daysToMaturity: 65, height: 'Vining', spacing: '18 inches' } },
          { name: 'Armenian', description: 'Long, ribbed cucumbers with mild taste', characteristics: { color: 'Light Green', size: 'large' }, growingInfo: { daysToMaturity: 70, height: 'Vining', spacing: '18-24 inches' } }
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
        growingSeason: 'spring',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Sweet Basil', description: 'Classic Italian basil with large, aromatic leaves', characteristics: { color: 'Green', size: 'medium' }, growingInfo: { daysToMaturity: 30, height: '12-24 inches', spacing: '12 inches' } },
          { name: 'Thai Basil', description: 'Spicy basil with purple stems and anise flavor', characteristics: { color: 'Green-Purple', size: 'medium' }, growingInfo: { daysToMaturity: 35, height: '18-24 inches', spacing: '12 inches' } },
          { name: 'Lemon Basil', description: 'Citrus-scented basil with bright flavor', characteristics: { color: 'Light Green', size: 'small' }, growingInfo: { daysToMaturity: 30, height: '12-18 inches', spacing: '10 inches' } },
          { name: 'Purple Basil', description: 'Dark purple leaves with strong basil flavor', characteristics: { color: 'Purple', size: 'medium' }, growingInfo: { daysToMaturity: 35, height: '12-20 inches', spacing: '12 inches' } }
        ]
      },
      {
        name: 'Mint',
        emoji: '🌱',
        description: 'A perennial herb with fragrant, toothed leaves and tiny purple, pink, or white flowers.',
        growingSeason: 'spring',
        sunRequirement: 'partial-sun',
        waterRequirement: 'high',
        varieties: [
          { name: 'Peppermint', description: 'Classic mint with strong, cooling flavor', characteristics: { color: 'Dark Green', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: '12-24 inches', spacing: '18 inches' } },
          { name: 'Spearmint', description: 'Milder mint flavor, great for cooking', characteristics: { color: 'Green', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: '12-24 inches', spacing: '18 inches' } },
          { name: 'Chocolate Mint', description: 'Mint with chocolate undertones', characteristics: { color: 'Dark Green', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: '12-20 inches', spacing: '18 inches' } },
          { name: 'Apple Mint', description: 'Fruity mint with apple-like aroma', characteristics: { color: 'Light Green', size: 'large' }, growingInfo: { daysToMaturity: 60, height: '18-30 inches', spacing: '24 inches' } }
        ]
      },
      {
        name: 'Rosemary',
        emoji: '🌿',
        description: 'A woody, perennial herb with fragrant, evergreen, needle-like leaves and white, pink, purple, or blue flowers.',
        growingSeason: 'year-round',
        sunRequirement: 'full-sun',
        waterRequirement: 'low',
        varieties: [
          { name: 'Tuscan Blue', description: 'Upright rosemary with blue flowers', characteristics: { color: 'Dark Green', size: 'large' }, growingInfo: { daysToMaturity: 90, height: '3-6 ft', spacing: '24-36 inches' } },
          { name: 'Prostrate', description: 'Trailing rosemary for ground cover', characteristics: { color: 'Green', size: 'medium' }, growingInfo: { daysToMaturity: 90, height: '6-12 inches', spacing: '18-24 inches' } },
          { name: 'Arp', description: 'Cold-hardy rosemary variety', characteristics: { color: 'Green', size: 'medium' }, growingInfo: { daysToMaturity: 90, height: '2-4 ft', spacing: '24 inches' } },
          { name: 'Gorizia', description: 'Large-leaved rosemary with strong flavor', characteristics: { color: 'Green', size: 'large' }, growingInfo: { daysToMaturity: 90, height: '3-5 ft', spacing: '30 inches' } }
        ]
      },
      {
        name: 'Thyme',
        emoji: '🌿',
        description: 'A low-growing woody perennial, cultivated as a culinary herb.',
        growingSeason: 'spring',
        sunRequirement: 'full-sun',
        waterRequirement: 'low',
        varieties: [
          { name: 'Common Thyme', description: 'Classic culinary thyme with strong flavor', characteristics: { color: 'Green', size: 'small' }, growingInfo: { daysToMaturity: 75, height: '6-12 inches', spacing: '12 inches' } },
          { name: 'Lemon Thyme', description: 'Thyme with citrus aroma and flavor', characteristics: { color: 'Green', size: 'small' }, growingInfo: { daysToMaturity: 75, height: '6-12 inches', spacing: '12 inches' } },
          { name: 'Creeping Thyme', description: 'Low-growing thyme perfect for ground cover', characteristics: { color: 'Green', size: 'small' }, growingInfo: { daysToMaturity: 75, height: '2-4 inches', spacing: '8 inches' } },
          { name: 'Caraway Thyme', description: 'Thyme with caraway-like flavor', characteristics: { color: 'Green', size: 'small' }, growingInfo: { daysToMaturity: 75, height: '6-12 inches', spacing: '12 inches' } }
        ]
      },
      {
        name: 'Sage',
        emoji: '🌿',
        description: 'A woody perennial herb with fragrant, evergreen, needle-like leaves and white, pink, purple, or blue flowers.',
        growingSeason: 'year-round',
        sunRequirement: 'full-sun',
        waterRequirement: 'low',
        varieties: [
          { name: 'Common Sage', description: 'Traditional culinary sage with gray-green leaves', characteristics: { color: 'Gray-Green', size: 'medium' }, growingInfo: { daysToMaturity: 90, height: '2-3 ft', spacing: '18-24 inches' } },
          { name: 'Purple Sage', description: 'Decorative sage with purple-tinted leaves', characteristics: { color: 'Purple-Green', size: 'medium' }, growingInfo: { daysToMaturity: 90, height: '2-3 ft', spacing: '18-24 inches' } },
          { name: 'Pineapple Sage', description: 'Sage with pineapple-like aroma', characteristics: { color: 'Green', size: 'large' }, growingInfo: { daysToMaturity: 90, height: '3-4 ft', spacing: '24 inches' } },
          { name: 'Golden Sage', description: 'Sage with golden-yellow leaves', characteristics: { color: 'Golden', size: 'medium' }, growingInfo: { daysToMaturity: 90, height: '2-3 ft', spacing: '18-24 inches' } }
        ]
      },
      {
        name: 'Lavender',
        emoji: '💜',
        description: 'A flowering plant in the mint family, known for its fragrant purple flowers and aromatic leaves.',
        growingSeason: 'summer',
        sunRequirement: 'full-sun',
        waterRequirement: 'low',
        varieties: [
          { name: 'English Lavender', description: 'Classic lavender with sweet fragrance', characteristics: { color: 'Purple', size: 'medium' }, growingInfo: { daysToMaturity: 120, height: '1-2 ft', spacing: '12-18 inches' } },
          { name: 'French Lavender', description: 'Lavender with distinctive butterfly-like flowers', characteristics: { color: 'Purple', size: 'medium' }, growingInfo: { daysToMaturity: 120, height: '1-2 ft', spacing: '12-18 inches' } },
          { name: 'Spanish Lavender', description: 'Compact lavender with pineapple-shaped flowers', characteristics: { color: 'Purple', size: 'small' }, growingInfo: { daysToMaturity: 120, height: '1-1.5 ft', spacing: '12 inches' } },
          { name: 'Lavandin', description: 'Hybrid lavender with strong fragrance', characteristics: { color: 'Purple', size: 'large' }, growingInfo: { daysToMaturity: 120, height: '2-3 ft', spacing: '18-24 inches' } }
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
        growingSeason: 'spring',
        sunRequirement: 'full-sun',
        waterRequirement: 'high',
        varieties: [
          { name: 'June-bearing', description: 'Traditional strawberries that fruit in early summer', characteristics: { color: 'Red', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: '6-8 inches', spacing: '18 inches' } },
          { name: 'Everbearing', description: 'Strawberries that fruit throughout the growing season', characteristics: { color: 'Red', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: '6-8 inches', spacing: '18 inches' } },
          { name: 'Day-neutral', description: 'Strawberries that fruit regardless of day length', characteristics: { color: 'Red', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: '6-8 inches', spacing: '18 inches' } },
          { name: 'Alpine', description: 'Small, intensely flavored strawberries', characteristics: { color: 'Red', size: 'small' }, growingInfo: { daysToMaturity: 60, height: '4-6 inches', spacing: '12 inches' } }
        ]
      },
      {
        name: 'Blueberry',
        emoji: '🫐',
        description: 'Perennial flowering plants with blue or purple berries, classified in the section Cyanococcus within the genus Vaccinium.',
        growingSeason: 'summer',
        sunRequirement: 'full-sun',
        waterRequirement: 'high',
        varieties: [
          { name: 'Highbush', description: 'Large, sweet berries on tall bushes', characteristics: { color: 'Blue', size: 'large' }, growingInfo: { daysToMaturity: 90, height: '4-8 ft', spacing: '4-6 ft' } },
          { name: 'Lowbush', description: 'Small, wild-type blueberries', characteristics: { color: 'Blue', size: 'small' }, growingInfo: { daysToMaturity: 90, height: '1-2 ft', spacing: '2-3 ft' } },
          { name: 'Rabbiteye', description: 'Southern variety with large, firm berries', characteristics: { color: 'Blue', size: 'large' }, growingInfo: { daysToMaturity: 90, height: '6-10 ft', spacing: '6-8 ft' } },
          { name: 'Half-high', description: 'Compact bushes with medium-sized berries', characteristics: { color: 'Blue', size: 'medium' }, growingInfo: { daysToMaturity: 90, height: '2-4 ft', spacing: '3-4 ft' } }
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
        growingSeason: 'spring',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Gala', description: 'Sweet, crisp apples with red-orange skin', characteristics: { color: 'Red-Orange', size: 'medium' }, growingInfo: { daysToMaturity: 150, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Granny Smith', description: 'Tart green apples, excellent for cooking', characteristics: { color: 'Green', size: 'large' }, growingInfo: { daysToMaturity: 160, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Honeycrisp', description: 'Sweet, juicy apples with crisp texture', characteristics: { color: 'Red-Yellow', size: 'large' }, growingInfo: { daysToMaturity: 170, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Fuji', description: 'Sweet, firm apples with long storage life', characteristics: { color: 'Red-Yellow', size: 'large' }, growingInfo: { daysToMaturity: 180, height: '15-20 ft', spacing: '15-20 ft' } }
        ]
      },
      {
        name: 'Cherry',
        emoji: '🍒',
        description: 'A fruit of the genus Prunus, produced by a limited number of species.',
        growingSeason: 'spring',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Bing', description: 'Large, dark red sweet cherries', characteristics: { color: 'Dark Red', size: 'large' }, growingInfo: { daysToMaturity: 90, height: '20-30 ft', spacing: '20-25 ft' } },
          { name: 'Rainier', description: 'Yellow-red sweet cherries with mild flavor', characteristics: { color: 'Yellow-Red', size: 'large' }, growingInfo: { daysToMaturity: 90, height: '20-30 ft', spacing: '20-25 ft' } },
          { name: 'Montmorency', description: 'Tart cherries perfect for pies and preserves', characteristics: { color: 'Red', size: 'medium' }, growingInfo: { daysToMaturity: 90, height: '20-30 ft', spacing: '20-25 ft' } },
          { name: 'Stella', description: 'Self-pollinating sweet cherry variety', characteristics: { color: 'Dark Red', size: 'large' }, growingInfo: { daysToMaturity: 90, height: '20-30 ft', spacing: '20-25 ft' } }
        ]
      },
      {
        name: 'Lemon',
        emoji: '🍋',
        description: 'A species of small evergreen tree in the flowering plant family Rutaceae, native to Asia.',
        growingSeason: 'year-round',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Meyer', description: 'Sweet, thin-skinned lemons with mild flavor', characteristics: { color: 'Yellow', size: 'medium' }, growingInfo: { daysToMaturity: 365, height: '10-15 ft', spacing: '12-15 ft' } },
          { name: 'Eureka', description: 'Classic sour lemons with thick skin', characteristics: { color: 'Yellow', size: 'large' }, growingInfo: { daysToMaturity: 365, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Lisbon', description: 'Thornless variety with smooth skin', characteristics: { color: 'Yellow', size: 'large' }, growingInfo: { daysToMaturity: 365, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Pink Variegated', description: 'Decorative lemon with pink flesh', characteristics: { color: 'Yellow-Pink', size: 'medium' }, growingInfo: { daysToMaturity: 365, height: '10-15 ft', spacing: '12-15 ft' } }
        ]
      },
      {
        name: 'Orange',
        emoji: '🍊',
        description: 'A fruit of various citrus species in the family Rutaceae, primarily referring to Citrus × sinensis.',
        growingSeason: 'winter',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Valencia', description: 'Sweet oranges perfect for juicing', characteristics: { color: 'Orange', size: 'large' }, growingInfo: { daysToMaturity: 365, height: '15-25 ft', spacing: '15-20 ft' } },
          { name: 'Navel', description: 'Seedless oranges with easy-to-peel skin', characteristics: { color: 'Orange', size: 'large' }, growingInfo: { daysToMaturity: 365, height: '15-25 ft', spacing: '15-20 ft' } },
          { name: 'Blood Orange', description: 'Oranges with red flesh and unique flavor', characteristics: { color: 'Red-Orange', size: 'medium' }, growingInfo: { daysToMaturity: 365, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Cara Cara', description: 'Pink-fleshed navel oranges with sweet taste', characteristics: { color: 'Pink-Orange', size: 'large' }, growingInfo: { daysToMaturity: 365, height: '15-25 ft', spacing: '15-20 ft' } }
        ]
      },
      {
        name: 'Peach',
        emoji: '🍑',
        description: 'A deciduous tree native to the region of Northwest China between the Tarim Basin and the north slopes of the Kunlun Mountains.',
        growingSeason: 'summer',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Elberta', description: 'Classic yellow-fleshed peaches', characteristics: { color: 'Yellow', size: 'large' }, growingInfo: { daysToMaturity: 120, height: '15-25 ft', spacing: '20-25 ft' } },
          { name: 'White Peach', description: 'White-fleshed peaches with mild flavor', characteristics: { color: 'White', size: 'medium' }, growingInfo: { daysToMaturity: 110, height: '15-25 ft', spacing: '20-25 ft' } },
          { name: 'Donut Peach', description: 'Flat, donut-shaped peaches with sweet flavor', characteristics: { color: 'Yellow', size: 'medium' }, growingInfo: { daysToMaturity: 115, height: '15-25 ft', spacing: '20-25 ft' } },
          { name: 'Nectarine', description: 'Smooth-skinned peaches with firm flesh', characteristics: { color: 'Yellow', size: 'medium' }, growingInfo: { daysToMaturity: 120, height: '15-25 ft', spacing: '20-25 ft' } }
        ]
      },
      {
        name: 'Pear',
        emoji: '🍐',
        description: 'A fruit tree of the genus Pyrus, in the family Rosaceae, bearing the pomaceous fruit of the same name.',
        growingSeason: 'fall',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Bartlett', description: 'Classic sweet pears with smooth texture', characteristics: { color: 'Yellow-Green', size: 'large' }, growingInfo: { daysToMaturity: 150, height: '15-25 ft', spacing: '20-25 ft' } },
          { name: 'Bosc', description: 'Firm pears with russeted skin', characteristics: { color: 'Brown', size: 'large' }, growingInfo: { daysToMaturity: 160, height: '15-25 ft', spacing: '20-25 ft' } },
          { name: 'Anjou', description: 'Sweet pears with green or red skin', characteristics: { color: 'Green-Red', size: 'large' }, growingInfo: { daysToMaturity: 155, height: '15-25 ft', spacing: '20-25 ft' } },
          { name: 'Comice', description: 'Premium dessert pears with buttery texture', characteristics: { color: 'Yellow-Green', size: 'large' }, growingInfo: { daysToMaturity: 165, height: '15-25 ft', spacing: '20-25 ft' } }
        ]
      },
      {
        name: 'Plum',
        emoji: '🫐',
        description: 'A fruit of the subgenus Prunus of the genus Prunus, with a smooth pit and a groove running down one side.',
        growingSeason: 'summer',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Santa Rosa', description: 'Sweet red plums with yellow flesh', characteristics: { color: 'Red', size: 'medium' }, growingInfo: { daysToMaturity: 100, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Italian Prune', description: 'Purple plums perfect for drying', characteristics: { color: 'Purple', size: 'medium' }, growingInfo: { daysToMaturity: 110, height: '15-20 ft', spacing: '15-20 ft' } },
          { name: 'Damson', description: 'Small tart plums for preserves', characteristics: { color: 'Blue-Purple', size: 'small' }, growingInfo: { daysToMaturity: 95, height: '10-15 ft', spacing: '12-15 ft' } },
          { name: 'Mirabelle', description: 'Small sweet yellow plums', characteristics: { color: 'Yellow', size: 'small' }, growingInfo: { daysToMaturity: 90, height: '10-15 ft', spacing: '12-15 ft' } }
        ]
      },
      {
        name: 'Jackfruit',
        emoji: '🍈',
        description: 'A species of tree in the fig, mulberry, and breadfruit family, native to southwest India.',
        growingSeason: 'summer',
        sunRequirement: 'full-sun',
        waterRequirement: 'high',
        varieties: [
          { name: 'Varikka', description: 'Traditional jackfruit variety with sweet flesh', characteristics: { color: 'Yellow', size: 'large' }, growingInfo: { daysToMaturity: 365, height: '30-70 ft', spacing: '25-35 ft' } },
          { name: 'Thenvarikka', description: 'Premium jackfruit variety with excellent taste', characteristics: { color: 'Yellow', size: 'large' }, growingInfo: { daysToMaturity: 365, height: '30-70 ft', spacing: '25-35 ft' } },
          { name: 'Singapore Jack', description: 'Compact jackfruit tree for smaller spaces', characteristics: { color: 'Yellow', size: 'medium' }, growingInfo: { daysToMaturity: 365, height: '20-30 ft', spacing: '20-25 ft' } },
          { name: 'Black Gold', description: 'Jackfruit with dark yellow flesh and rich flavor', characteristics: { color: 'Dark Yellow', size: 'large' }, growingInfo: { daysToMaturity: 365, height: '30-70 ft', spacing: '25-35 ft' } }
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
        growingSeason: 'fall',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Hard Red Winter', description: 'High-protein wheat for bread making', characteristics: { color: 'Golden', size: 'medium' }, growingInfo: { daysToMaturity: 240, height: '2-4 ft', spacing: '1-2 inches' } },
          { name: 'Soft White', description: 'Low-protein wheat for pastries and cakes', characteristics: { color: 'Golden', size: 'medium' }, growingInfo: { daysToMaturity: 240, height: '2-4 ft', spacing: '1-2 inches' } },
          { name: 'Durum', description: 'Hard wheat for pasta and semolina', characteristics: { color: 'Golden', size: 'medium' }, growingInfo: { daysToMaturity: 240, height: '2-4 ft', spacing: '1-2 inches' } },
          { name: 'Spelt', description: 'Ancient wheat with nutty flavor', characteristics: { color: 'Golden', size: 'medium' }, growingInfo: { daysToMaturity: 240, height: '2-4 ft', spacing: '1-2 inches' } }
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
        growingSeason: 'spring',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Green Bean', description: 'Tender pods eaten fresh or cooked', characteristics: { color: 'Green', size: 'medium' }, growingInfo: { daysToMaturity: 55, height: 'Vining/Bush', spacing: '4-6 inches' } },
          { name: 'Kidney Bean', description: 'Red beans for soups and chili', characteristics: { color: 'Red', size: 'medium' }, growingInfo: { daysToMaturity: 90, height: 'Vining/Bush', spacing: '4-6 inches' } },
          { name: 'Black Bean', description: 'Small black beans with rich flavor', characteristics: { color: 'Black', size: 'small' }, growingInfo: { daysToMaturity: 85, height: 'Vining/Bush', spacing: '4-6 inches' } },
          { name: 'Pinto Bean', description: 'Speckled beans popular in Mexican cuisine', characteristics: { color: 'Pink-Brown', size: 'medium' }, growingInfo: { daysToMaturity: 90, height: 'Vining/Bush', spacing: '4-6 inches' } }
        ]
      },
      {
        name: 'Pea',
        emoji: '🫛',
        description: 'Most commonly the small spherical seed or the seed-pod of the flowering plant species Pisum sativum.',
        growingSeason: 'spring',
        sunRequirement: 'full-sun',
        waterRequirement: 'medium',
        varieties: [
          { name: 'Garden Pea', description: 'Traditional shelling peas', characteristics: { color: 'Green', size: 'small' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '2-3 inches' } },
          { name: 'Snow Pea', description: 'Flat pods eaten whole', characteristics: { color: 'Green', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '2-3 inches' } },
          { name: 'Snap Pea', description: 'Plump pods eaten whole', characteristics: { color: 'Green', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '2-3 inches' } },
          { name: 'Sugar Pea', description: 'Sweet peas with edible pods', characteristics: { color: 'Green', size: 'medium' }, growingInfo: { daysToMaturity: 60, height: 'Vining', spacing: '2-3 inches' } }
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
          createdBy: '689220c1596aee3de42045d1', // Super admin user ID
          organizationId: '689220c1596aee3de42045d3' // Sanctity Ferme organization ID
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
            createdBy: '689220c1596aee3de42045d1', // Super admin user ID
            organizationId: '689220c1596aee3de42045d3' // Sanctity Ferme organization ID
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
