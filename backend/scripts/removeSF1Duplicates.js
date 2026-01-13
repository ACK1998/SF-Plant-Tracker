const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plant = require('../models/Plant');
const Plot = require('../models/Plot');
const Domain = require('../models/Domain');

async function removeSF1Duplicates() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const domain = await Domain.findOne({ name: 'SF1' });
    if (!domain) {
      throw new Error('SF1 domain not found.');
    }

    const plants = await Plant.find({
      domainId: domain._id,
      isActive: true
    }).select('name type plotId createdAt').populate('plotId', 'name').sort({ createdAt: 1 });

    console.log(`\n📊 Analyzing ${plants.length} plants for duplicates...\n`);

    const plantMap = new Map();
    const duplicatesToRemove = [];

    for (const plant of plants) {
      const nameWithoutEmoji = plant.name.replace(/^[\u{1F300}-\u{1F9FF}]+\s*/u, '').trim();
      const key = `${plant.plotId._id}_${plant.type}_${nameWithoutEmoji}`;
      
      if (plantMap.has(key)) {
        // This is a duplicate - mark for removal (keep the first one)
        duplicatesToRemove.push(plant._id);
      } else {
        plantMap.set(key, plant._id);
      }
    }

    if (duplicatesToRemove.length === 0) {
      console.log('✅ No duplicates found!');
      await mongoose.connection.close();
      return;
    }

    console.log(`❌ Found ${duplicatesToRemove.length} duplicates to remove\n`);
    console.log('Removing duplicates (keeping the first occurrence of each)...\n');

    // Remove duplicates
    const result = await Plant.deleteMany({
      _id: { $in: duplicatesToRemove }
    });

    console.log(`✅ Removed ${result.deletedCount} duplicate plants`);

    // Verify final count
    const finalCount = await Plant.countDocuments({
      domainId: domain._id,
      isActive: true
    });

    console.log(`\n📊 Final plant count in SF1: ${finalCount}`);
    console.log(`📊 Expected from CSV: 1797`);
    console.log(`📊 Difference: ${1797 - finalCount} plants`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

if (require.main === module) {
  removeSF1Duplicates();
}

module.exports = removeSF1Duplicates;

