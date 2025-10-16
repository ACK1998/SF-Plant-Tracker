const mongoose = require('mongoose');
require('dotenv').config();

async function testDataMapping() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all plants
    const plants = await mongoose.connection.db.collection('plants').find({}).toArray();
    console.log(`Total plants: ${plants.length}\n`);

    // Get all plant types
    const plantTypes = await mongoose.connection.db.collection('planttypes').find({}).toArray();
    console.log(`Total plant types: ${plantTypes.length}\n`);

    // Get all plant varieties
    const plantVarieties = await mongoose.connection.db.collection('plantvarieties').find({}).toArray();
    console.log(`Total plant varieties: ${plantVarieties.length}\n`);

    // Check plant type mapping
    console.log('=== PLANT TYPE MAPPING ===');
    const plantTypeNames = plantTypes.map(pt => pt.name);
    const plantTypeCategories = plantTypes.map(pt => pt.category);
    
    const plantsWithTypes = plants.filter(plant => plant.type);
    const plantsWithoutTypes = plants.filter(plant => !plant.type);
    
    console.log(`Plants with type: ${plantsWithTypes.length}`);
    console.log(`Plants without type: ${plantsWithoutTypes.length}`);
    
    const unmappedTypes = plantsWithTypes.filter(plant => !plantTypeNames.includes(plant.type));
    console.log(`Plants with unmapped types: ${unmappedTypes.length}`);
    
    if (unmappedTypes.length > 0) {
      console.log('Unmapped plant types:');
      unmappedTypes.forEach(plant => {
        console.log(`  - ${plant.name}: ${plant.type}`);
      });
    }

    // Check category mapping
    console.log('\n=== CATEGORY MAPPING ===');
    const plantsWithCategories = plants.filter(plant => plant.category);
    const plantsWithoutCategories = plants.filter(plant => !plant.category);
    
    console.log(`Plants with category: ${plantsWithCategories.length}`);
    console.log(`Plants without category: ${plantsWithoutCategories.length}`);
    
    const uniqueCategories = [...new Set(plantsWithCategories.map(p => p.category))];
    console.log('Categories in plants:', uniqueCategories);
    
    const uniqueTypeCategories = [...new Set(plantTypeCategories)];
    console.log('Categories in plant types:', uniqueTypeCategories);

    // Check variety mapping
    console.log('\n=== VARIETY MAPPING ===');
    const plantsWithVarieties = plants.filter(plant => plant.variety);
    const plantsWithoutVarieties = plants.filter(plant => !plant.variety);
    
    console.log(`Plants with variety: ${plantsWithVarieties.length}`);
    console.log(`Plants without variety: ${plantsWithoutVarieties.length}`);
    
    const varietyNames = plantVarieties.map(pv => pv.name);
    const unmappedVarieties = plantsWithVarieties.filter(plant => !varietyNames.includes(plant.variety));
    console.log(`Plants with unmapped varieties: ${unmappedVarieties.length}`);
    
    if (unmappedVarieties.length > 0) {
      console.log('Unmapped varieties:');
      unmappedVarieties.forEach(plant => {
        console.log(`  - ${plant.name}: ${plant.variety}`);
      });
    }

    // Sample data display
    console.log('\n=== SAMPLE DATA ===');
    console.log('Sample plants:');
    plants.slice(0, 5).forEach(plant => {
      console.log(`  - ${plant.name}: Type=${plant.type || 'N/A'}, Category=${plant.category || 'N/A'}, Variety=${plant.variety || 'N/A'}`);
    });

    console.log('\nSample plant types:');
    plantTypes.slice(0, 5).forEach(type => {
      console.log(`  - ${type.name}: Category=${type.category}`);
    });

    console.log('\nSample plant varieties:');
    plantVarieties.slice(0, 5).forEach(variety => {
      console.log(`  - ${variety.name}: Plant Type=${variety.plantTypeName}`);
    });

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Total plants: ${plants.length}`);
    console.log(`✅ Total plant types: ${plantTypes.length}`);
    console.log(`✅ Total plant varieties: ${plantVarieties.length}`);
    console.log(`⚠️  Plants with unmapped types: ${unmappedTypes.length}`);
    console.log(`⚠️  Plants with unmapped varieties: ${unmappedVarieties.length}`);
    console.log(`⚠️  Plants without categories: ${plantsWithoutCategories.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testDataMapping();
