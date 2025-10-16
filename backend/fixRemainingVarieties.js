const mongoose = require('mongoose');
require('dotenv').config();

async function fixRemainingVarieties() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get existing data
    const existingVarieties = await mongoose.connection.db.collection('plantvarieties').find({}).toArray();
    const existingUsers = await mongoose.connection.db.collection('users').find({}).toArray();
    const existingOrganizations = await mongoose.connection.db.collection('organizations').find({}).toArray();

    // Get IDs for references
    const userId = existingUsers.length > 0 ? existingUsers[0]._id : new mongoose.Types.ObjectId();
    const orgId = existingOrganizations.length > 0 ? existingOrganizations[0]._id : new mongoose.Types.ObjectId();

    console.log('Fixing remaining variety mapping issues...\n');

    // Get plant types for reference
    const plantTypes = await mongoose.connection.db.collection('planttypes').find({}).toArray();

    // Fix case-sensitive variety names
    const caseFixes = [
      {
        name: 'Thenvarikka', // Fix capitalization
        plantTypeName: 'Jackfruit',
        description: 'Medium-sized jackfruit variety (corrected capitalization)',
        characteristics: { color: 'Yellow', size: 'medium', taste: 'Sweet', texture: 'Soft' },
        growingInfo: { daysToMaturity: 730, height: '25-40 ft', spacing: '20-25 ft', harvestTime: 'Summer' },
        isActive: true,
        isDefault: false,
        createdBy: userId,
        organizationId: orgId
      },
      {
        name: 'Nadan', // Fix capitalization
        plantTypeName: 'Tomato',
        description: 'Traditional tomato variety (corrected capitalization)',
        characteristics: { color: 'Red', size: 'medium', taste: 'Sweet', texture: 'Firm' },
        growingInfo: { daysToMaturity: 75, height: '4-6 ft', spacing: '24 inches', harvestTime: 'Summer' },
        isActive: true,
        isDefault: false,
        createdBy: userId,
        organizationId: orgId
      }
    ];

    // Add case-corrected varieties
    const addedVarieties = [];
    for (const variety of caseFixes) {
      const plantType = plantTypes.find(pt => pt.name === variety.plantTypeName);
      if (!plantType) {
        console.log(`❌ Plant type not found for variety: ${variety.name} (${variety.plantTypeName})`);
        continue;
      }

      const existingVariety = existingVarieties.find(v => 
        v.name.toLowerCase() === variety.name.toLowerCase() && 
        v.plantTypeName === variety.plantTypeName
      );
      
      if (!existingVariety) {
        const result = await mongoose.connection.db.collection('plantvarieties').insertOne({
          ...variety,
          plantTypeId: plantType._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        addedVarieties.push({ ...variety, _id: result.insertedId });
        console.log(`✅ Added case-corrected variety: ${variety.name} (${variety.plantTypeName})`);
      } else {
        console.log(`⏭️  Variety already exists: ${variety.name} (${variety.plantTypeName})`);
      }
    }

    console.log(`\nAdded ${addedVarieties.length} case-corrected varieties\n`);

    // Update existing plants to use correct case
    console.log('Updating plant variety names to match database...\n');
    
    const plants = await mongoose.connection.db.collection('plants').find({}).toArray();
    let updatedPlants = 0;

    for (const plant of plants) {
      let needsUpdate = false;
      let updateData = {};

      // Fix case-sensitive variety names
      if (plant.variety === 'thenvarikka') {
        updateData.variety = 'Thenvarikka';
        needsUpdate = true;
        console.log(`✅ Updated plant "${plant.name}": thenvarikka → Thenvarikka`);
      } else if (plant.variety === 'nadan') {
        updateData.variety = 'Nadan';
        needsUpdate = true;
        console.log(`✅ Updated plant "${plant.name}": nadan → Nadan`);
      }

      if (needsUpdate) {
        await mongoose.connection.db.collection('plants').updateOne(
          { _id: plant._id },
          { $set: updateData }
        );
        updatedPlants++;
      }
    }

    console.log(`\nUpdated ${updatedPlants} plants\n`);

    // Final summary
    console.log('=== FINAL FIX SUMMARY ===');
    console.log(`✅ Added ${addedVarieties.length} case-corrected varieties`);
    console.log(`✅ Updated ${updatedPlants} plants with correct variety names`);
    console.log(`📊 Total plant types: ${plantTypes.length}`);
    console.log(`📊 Total plant varieties: ${existingVarieties.length + addedVarieties.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixRemainingVarieties();
