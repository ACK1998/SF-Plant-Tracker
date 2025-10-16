const mongoose = require('mongoose');
const Plant = require('./models/Plant');
const Organization = require('./models/Organization');
const User = require('./models/User');
const PlantType = require('./models/PlantType');

async function addPlantsToPlots() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas database');

    console.log('\n=== ADDING PLANTS TO ALL PLOTS ===');
    
    // Get organization and users
    const organization = await Organization.findOne({});
    const users = await User.find({}).select('_id firstName lastName role');
    const plantTypes = await PlantType.find({}).select('_id name category emoji');
    
    if (!organization) {
      console.log('❌ No organization found');
      return;
    }

    console.log(`✅ Found organization: ${organization.name}`);
    console.log(`👥 Found ${users.length} users`);
    console.log(`🌿 Found ${plantTypes.length} plant types`);

    // Get all plots
    const plots = await mongoose.connection.db.collection('plots').find({}).toArray();
    console.log(`📍 Found ${plots.length} plots`);

    if (plots.length === 0) {
      console.log('❌ No plots found. Please create plots first.');
      return;
    }

    // Get all domains
    const domains = await mongoose.connection.db.collection('domains').find({}).toArray();
    console.log(`🏘️ Found ${domains.length} domains`);

    // Get plant varieties
    const varieties = await mongoose.connection.db.collection('plantvarieties').find({}).toArray();
    console.log(`🍃 Found ${varieties.length} plant varieties`);

    // Sample plants to add (with realistic names and data)
    const samplePlants = [
      // Vegetables
      { name: 'Tomato Plant 1', type: 'Tomato', variety: 'Roma', category: 'vegetable', health: 'excellent', growthStage: 'seedling' },
      { name: 'Tomato Plant 2', type: 'Tomato', variety: 'Cherry', category: 'vegetable', health: 'good', growthStage: 'vegetative' },
      { name: 'Carrot Patch 1', type: 'Carrot', variety: 'Nantes', category: 'vegetable', health: 'excellent', growthStage: 'seedling' },
      { name: 'Lettuce Head 1', type: 'Lettuce', variety: 'Romaine', category: 'vegetable', health: 'good', growthStage: 'mature' },
      { name: 'Cucumber Vine 1', type: 'Cucumber', variety: 'English', category: 'vegetable', health: 'excellent', growthStage: 'flowering' },
      
      // Fruits
      { name: 'Strawberry Plant 1', type: 'Strawberry', variety: 'Alpine', category: 'fruit', health: 'excellent', growthStage: 'fruiting' },
      { name: 'Apple Tree 1', type: 'Apple', variety: 'Red Delicious', category: 'tree', health: 'good', growthStage: 'mature' },
      { name: 'Lemon Tree 1', type: 'Lemon', variety: 'Meyer', category: 'tree', health: 'excellent', growthStage: 'fruiting' },
      { name: 'Orange Tree 1', type: 'Orange', variety: 'Navel', category: 'tree', health: 'good', growthStage: 'mature' },
      
      // Herbs
      { name: 'Basil Plant 1', type: 'Basil', variety: 'Sweet Basil', category: 'herb', health: 'excellent', growthStage: 'vegetative' },
      { name: 'Mint Plant 1', type: 'Mint', variety: 'Peppermint', category: 'herb', health: 'good', growthStage: 'mature' },
      { name: 'Rosemary Bush 1', type: 'Rosemary', variety: 'Tuscan Blue', category: 'herb', health: 'excellent', growthStage: 'mature' },
      
      // Trees
      { name: 'Mango Tree 1', type: 'Mango', variety: 'Alphonso', category: 'tree', health: 'excellent', growthStage: 'mature' },
      { name: 'Coconut Tree 1', type: 'Coconut', variety: 'Tall', category: 'tree', health: 'good', growthStage: 'mature' },
      { name: 'Banana Plant 1', type: 'Banana', variety: 'Cavendish', category: 'tree', health: 'excellent', growthStage: 'fruiting' },
      { name: 'Jackfruit Tree 1', type: 'Jackfruit', variety: 'Varikka', category: 'tree', health: 'good', growthStage: 'mature' },
      
      // More variety
      { name: 'Guava Tree 1', type: 'Guava', variety: 'Allahabad Safeda', category: 'tree', health: 'excellent', growthStage: 'mature' },
      { name: 'Pomegranate Tree 1', type: 'Pomegranate', variety: 'Bhagwa', category: 'tree', health: 'good', growthStage: 'fruiting' },
      { name: 'Peach Tree 1', type: 'Peach', variety: 'Elberta', category: 'tree', health: 'excellent', growthStage: 'mature' },
      { name: 'Blueberry Bush 1', type: 'Blueberry', variety: 'Highbush', category: 'fruit', health: 'good', growthStage: 'fruiting' }
    ];

    let createdPlants = 0;
    const growthStages = ['seedling', 'vegetative', 'flowering', 'fruiting', 'mature'];
    const healthLevels = ['excellent', 'good', 'fair', 'poor', 'deceased'];

    // Add plants to each plot
    for (let i = 0; i < plots.length; i++) {
      const plot = plots[i];
      const domain = domains[i % domains.length] || domains[0];
      const user = users[i % users.length] || users[0];
      
      console.log(`\n📍 Adding plants to plot: ${plot.name || 'Plot ' + (i + 1)}`);

      // Add 3-5 plants per plot
      const plantsPerPlot = Math.floor(Math.random() * 3) + 3; // 3-5 plants
      
      for (let j = 0; j < plantsPerPlot; j++) {
        const plantData = samplePlants[(i * plantsPerPlot + j) % samplePlants.length];
        const plantType = plantTypes.find(pt => pt.name === plantData.type);
        
        if (!plantType) {
          console.log(`  ⚠️ Plant type not found: ${plantData.type}`);
          continue;
        }

        // Find a variety for this plant type
        const plantVarieties = varieties.filter(v => v.plantTypeId.toString() === plantType._id.toString());
        const variety = plantVarieties[Math.floor(Math.random() * plantVarieties.length)] || plantVarieties[0];

        // Create plant with realistic data
        const plant = await Plant.create({
          name: `${plantData.name} - Plot ${i + 1}`,
          type: plantType.name,
          variety: variety ? variety.name : plantData.variety,
          category: plantType.category,
          plotId: plot._id,
          domainId: domain._id,
          organizationId: organization._id,
          plantedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
          plantedBy: user._id,
          planter: `${user.firstName} ${user.lastName}`,
          lastWatered: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
          health: plantData.health,
          growthStage: plantData.growthStage,
          image: plantType.emoji,
          harvestYield: Math.floor(Math.random() * 10), // Random yield 0-9
          isActive: true,
          statusHistory: [{
            date: new Date(),
            status: 'planted',
            health: plantData.health,
            growthStage: plantData.growthStage,
            image: plantType.emoji,
            notes: 'Plant added to plot',
            updatedBy: user._id,
            wateringAmount: Math.floor(Math.random() * 5) + 1 // Random watering amount 1-5
          }]
        });

        console.log(`  ✅ Added: ${plant.name} (${plantType.name} ${plantType.emoji}) - ${plant.health} health`);
        createdPlants++;
      }
    }

    console.log(`\n🎉 Successfully created ${createdPlants} plants across ${plots.length} plots!`);

    // Show summary by category
    console.log('\n=== PLANT SUMMARY BY CATEGORY ===');
    const plantsByCategory = await Plant.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    plantsByCategory.forEach(cat => {
      console.log(`  - ${cat._id}: ${cat.count} plants`);
    });

    // Show summary by plot
    console.log('\n=== PLANTS PER PLOT ===');
    const plantsByPlot = await Plant.aggregate([
      { $lookup: { from: 'plots', localField: 'plotId', foreignField: '_id', as: 'plot' } },
      { $group: { _id: '$plotId', plotName: { $first: '$plot.name' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    plantsByPlot.forEach(plot => {
      console.log(`  - ${plot.plotName || 'Unknown Plot'}: ${plot.count} plants`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Plants added to all plots successfully!');
  } catch (error) {
    console.error('❌ Error adding plants to plots:', error);
  }
}

addPlantsToPlots();
