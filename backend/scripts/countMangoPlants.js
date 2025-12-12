const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Domain = require('../models/Domain');
const Plant = require('../models/Plant');

async function countMangoPlants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const domain = await Domain.findOne({ name: 'SF3' });
    if (!domain) {
      throw new Error('SF3 domain not found');
    }
    
    const mangoCount = await Plant.countDocuments({ 
      domainId: domain._id,
      type: 'Mango',
      isActive: true 
    });
    
    console.log(`Total Mango plants in SF3 domain: ${mangoCount}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

countMangoPlants();

