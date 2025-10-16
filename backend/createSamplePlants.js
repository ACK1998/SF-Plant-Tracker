const mongoose = require('mongoose');
const Plant = require('./models/Plant');
const PlantType = require('./models/PlantType');
const PlantVariety = require('./models/PlantVariety');
const User = require('./models/User');
const Organization = require('./models/Organization');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get the super admin user and organization
    const user = await User.findOne({ email: 'superadmin@sanctityferme.com' });
    const organization = await Organization.findOne({ name: 'Sentienz' });
    
    if (!user || !organization) {
      console.error('User or organization not found');
      process.exit(1);
    }
    
    // Get all plant types and varieties
    const plantTypes = await PlantType.find({});
    const plantVarieties = await PlantVariety.find({}).populate('plantTypeId');
    
    console.log('Found plant types:', plantTypes.length);
    console.log('Found plant varieties:', plantVarieties.length);
    
    // Create sample plants using existing types and varieties
    const samplePlants = [
      {
        name: 'Tomato Plant 1',
        plantTypeId: plantTypes.find(t => t.name === 'Tomato')._id,
        plantVarietyId: plantVarieties.find(v => v.name === 'Roma' && v.plantTypeId.name === 'Tomato')._id,
        description: 'A healthy Roma tomato plant',
        plantingDate: new Date('2024-03-15'),
        expectedHarvestDate: new Date('2024-07-15'),
        status: 'growing',
        location: 'Greenhouse A',
        notes: 'Growing well, needs regular watering',
        createdBy: user._id,
        organizationId: organization._id
      },
      {
        name: 'Carrot Patch 1',
        plantTypeId: plantTypes.find(t => t.name === 'Carrot')._id,
        plantVarietyId: plantVarieties.find(v => v.name === 'Nantes' && v.plantTypeId.name === 'Carrot')._id,
        description: 'Sweet Nantes carrots',
        plantingDate: new Date('2024-02-20'),
        expectedHarvestDate: new Date('2024-06-20'),
        status: 'growing',
        location: 'Garden Bed 2',
        notes: 'Good soil conditions',
        createdBy: user._id,
        organizationId: organization._id
      },
      {
        name: 'Lettuce Row 1',
        plantTypeId: plantTypes.find(t => t.name === 'Lettuce')._id,
        plantVarietyId: plantVarieties.find(v => v.name === 'Romaine' && v.plantTypeId.name === 'Lettuce')._id,
        description: 'Crispy Romaine lettuce',
        plantingDate: new Date('2024-04-01'),
        expectedHarvestDate: new Date('2024-05-15'),
        status: 'growing',
        location: 'Garden Bed 1',
        notes: 'Partial shade, growing fast',
        createdBy: user._id,
        organizationId: organization._id
      },
      {
        name: 'Cucumber Vine 1',
        plantTypeId: plantTypes.find(t => t.name === 'Cucumber')._id,
        plantVarietyId: plantVarieties.find(v => v.name === 'English' && v.plantTypeId.name === 'Cucumber')._id,
        description: 'Long English cucumbers',
        plantingDate: new Date('2024-03-25'),
        expectedHarvestDate: new Date('2024-07-10'),
        status: 'growing',
        location: 'Trellis Area',
        notes: 'Needs trellis support',
        createdBy: user._id,
        organizationId: organization._id
      },
      {
        name: 'Bell Pepper Plant 1',
        plantTypeId: plantTypes.find(t => t.name === 'Bell Pepper')._id,
        plantVarietyId: plantVarieties.find(v => v.name === 'Green Bell' && v.plantTypeId.name === 'Bell Pepper')._id,
        description: 'Green bell peppers',
        plantingDate: new Date('2024-03-10'),
        expectedHarvestDate: new Date('2024-07-20'),
        status: 'growing',
        location: 'Garden Bed 3',
        notes: 'Full sun, good drainage',
        createdBy: user._id,
        organizationId: organization._id
      }
    ];
    
    // Insert sample plants
    const createdPlants = await Plant.insertMany(samplePlants);
    console.log('Created', createdPlants.length, 'sample plants');
    
    // Now let's check what types and varieties are actually used in plants
    const plantsWithTypes = await Plant.find({})
      .populate('plantTypeId')
      .populate('plantVarietyId');
    
    console.log('\n=== PLANTS WITH TYPES AND VARIETIES ===');
    const usedTypes = new Set();
    const usedVarieties = new Set();
    
    plantsWithTypes.forEach(plant => {
      console.log(`Plant: ${plant.name}`);
      console.log(`  Type: ${plant.plantTypeId.name} (${plant.plantTypeId.category})`);
      console.log(`  Variety: ${plant.plantVarietyId.name}`);
      console.log('');
      
      usedTypes.add(plant.plantTypeId.name);
      usedVarieties.add(plant.plantVarietyId.name);
    });
    
    console.log('=== SUMMARY ===');
    console.log('Types used in plants:', Array.from(usedTypes));
    console.log('Varieties used in plants:', Array.from(usedVarieties));
    
    // Check if all used types and varieties exist in our plant types/varieties lists
    console.log('\n=== CROSS-REFERENCE CHECK ===');
    
    const allTypeNames = plantTypes.map(t => t.name);
    const allVarietyNames = plantVarieties.map(v => v.name);
    
    console.log('All available types:', allTypeNames);
    console.log('All available varieties:', allVarietyNames);
    
    const missingTypes = Array.from(usedTypes).filter(type => !allTypeNames.includes(type));
    const missingVarieties = Array.from(usedVarieties).filter(variety => !allVarietyNames.includes(variety));
    
    if (missingTypes.length > 0) {
      console.log('❌ Missing types in plant types list:', missingTypes);
    } else {
      console.log('✅ All plant types are in the plant types list');
    }
    
    if (missingVarieties.length > 0) {
      console.log('❌ Missing varieties in plant varieties list:', missingVarieties);
    } else {
      console.log('✅ All plant varieties are in the plant varieties list');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
