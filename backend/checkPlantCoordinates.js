const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plant = require('./models/Plant');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const checkPlantCoordinates = async () => {
  try {
    await connectDB();
    console.log('🔍 Checking plant coordinates...');

    const plants = await Plant.find();
    console.log(`Total plants: ${plants.length}`);

    const plantsWithoutCoords = [];
    const plantsWithCoords = [];

    plants.forEach(plant => {
      if (!plant.latitude || !plant.longitude) {
        plantsWithoutCoords.push(plant);
      } else {
        plantsWithCoords.push(plant);
      }
    });

    console.log(`\n✅ Plants WITH coordinates: ${plantsWithCoords.length}`);
    plantsWithCoords.forEach(p => {
      console.log(`   ${p.name} - Plot: ${p.plotId} - Coords: ${p.latitude}, ${p.longitude}`);
    });

    console.log(`\n❌ Plants WITHOUT coordinates: ${plantsWithoutCoords.length}`);
    plantsWithoutCoords.forEach(p => {
      console.log(`   ${p.name} - Plot: ${p.plotId}`);
    });

  } catch (error) {
    console.error('❌ Error checking plant coordinates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

checkPlantCoordinates();




