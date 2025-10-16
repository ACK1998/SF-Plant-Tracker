const mongoose = require('mongoose');
const Plot = require('./models/Plot');
const Plant = require('./models/Plant');
const Domain = require('./models/Domain');
require('dotenv').config();

// Sample coordinates for different regions in India
const sampleCoordinates = [
  // Maharashtra
  { lat: 19.0760, lng: 72.8777, region: 'Mumbai' },
  { lat: 18.5204, lng: 73.8567, region: 'Pune' },
  { lat: 19.9975, lng: 73.7898, region: 'Nashik' },
  
  // Karnataka
  { lat: 12.9716, lng: 77.5946, region: 'Bangalore' },
  { lat: 12.2958, lng: 76.6394, region: 'Mysore' },
  { lat: 15.2993, lng: 74.1240, region: 'Goa' },
  
  // Tamil Nadu
  { lat: 13.0827, lng: 80.2707, region: 'Chennai' },
  { lat: 11.0168, lng: 76.9558, region: 'Coimbatore' },
  { lat: 9.9252, lng: 78.1198, region: 'Madurai' },
  
  // Kerala
  { lat: 10.8505, lng: 76.2711, region: 'Kochi' },
  { lat: 8.5241, lng: 76.9366, region: 'Thiruvananthapuram' },
  { lat: 10.5276, lng: 76.2144, region: 'Thrissur' },
  
  // Andhra Pradesh
  { lat: 17.3850, lng: 78.4867, region: 'Hyderabad' },
  { lat: 16.5062, lng: 80.6480, region: 'Vijayawada' },
  { lat: 14.4426, lng: 79.9865, region: 'Nellore' },
  
  // Telangana
  { lat: 17.3850, lng: 78.4867, region: 'Hyderabad' },
  { lat: 18.1124, lng: 79.0193, region: 'Warangal' },
  { lat: 17.6868, lng: 83.2185, region: 'Visakhapatnam' },
  
  // Gujarat
  { lat: 23.0225, lng: 72.5714, region: 'Ahmedabad' },
  { lat: 22.2587, lng: 71.1924, region: 'Rajkot' },
  { lat: 21.1702, lng: 79.0949, region: 'Nagpur' },
  
  // Rajasthan
  { lat: 26.9124, lng: 75.7873, region: 'Jaipur' },
  { lat: 26.4499, lng: 74.6399, region: 'Ajmer' },
  { lat: 24.8799, lng: 74.6298, region: 'Udaipur' },
  
  // Uttar Pradesh
  { lat: 26.8467, lng: 80.9462, region: 'Lucknow' },
  { lat: 25.3176, lng: 82.9739, region: 'Varanasi' },
  { lat: 27.1767, lng: 78.0081, region: 'Agra' },
  
  // Madhya Pradesh
  { lat: 23.1793, lng: 75.7849, region: 'Indore' },
  { lat: 22.7196, lng: 75.8577, region: 'Bhopal' },
  { lat: 21.1458, lng: 79.0882, region: 'Nagpur' },
  
  // West Bengal
  { lat: 22.5726, lng: 88.3639, region: 'Kolkata' },
  { lat: 23.6102, lng: 85.2799, region: 'Ranchi' },
  { lat: 22.8905, lng: 88.3701, region: 'Howrah' },
  
  // Odisha
  { lat: 20.2961, lng: 85.8245, region: 'Bhubaneswar' },
  { lat: 19.8762, lng: 85.8162, region: 'Puri' },
  { lat: 21.4927, lng: 83.8824, region: 'Sambalpur' },
  
  // Bihar
  { lat: 25.5941, lng: 85.1376, region: 'Patna' },
  { lat: 25.3176, lng: 82.9739, region: 'Varanasi' },
  { lat: 24.7964, lng: 85.0004, region: 'Gaya' },
  
  // Jharkhand
  { lat: 23.6102, lng: 85.2799, region: 'Ranchi' },
  { lat: 23.7307, lng: 86.1595, region: 'Dhanbad' },
  { lat: 22.8046, lng: 86.2029, region: 'Jamshedpur' },
  
  // Assam
  { lat: 26.1445, lng: 91.7362, region: 'Guwahati' },
  { lat: 26.1862, lng: 92.3057, region: 'Tezpur' },
  { lat: 27.4728, lng: 95.0195, region: 'Dibrugarh' },
  
  // Punjab
  { lat: 31.6340, lng: 74.8723, region: 'Amritsar' },
  { lat: 30.7333, lng: 76.7794, region: 'Chandigarh' },
  { lat: 31.1048, lng: 75.9463, region: 'Ludhiana' },
  
  // Haryana
  { lat: 30.7333, lng: 76.7794, region: 'Chandigarh' },
  { lat: 28.4595, lng: 77.0266, region: 'Gurgaon' },
  { lat: 29.0588, lng: 76.0856, region: 'Rohtak' },
  
  // Himachal Pradesh
  { lat: 31.1048, lng: 77.1734, region: 'Shimla' },
  { lat: 32.2432, lng: 77.1892, region: 'Manali' },
  { lat: 31.6339, lng: 76.7282, region: 'Dharamshala' },
  
  // Uttarakhand
  { lat: 30.0668, lng: 79.0193, region: 'Dehradun' },
  { lat: 29.3919, lng: 79.4542, region: 'Nainital' },
  { lat: 30.4598, lng: 78.0880, region: 'Haridwar' }
];

function getRandomCoordinate() {
  return sampleCoordinates[Math.floor(Math.random() * sampleCoordinates.length)];
}

function addSmallOffset(lat, lng, maxOffset = 0.01) {
  const latOffset = (Math.random() - 0.5) * maxOffset;
  const lngOffset = (Math.random() - 0.5) * maxOffset;
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset
  };
}

async function updateDomainsWithCoordinates() {
  try {
    console.log('Starting to update domains with coordinates...');
    
    const domains = await Domain.find({ $or: [{ latitude: { $exists: false } }, { latitude: null }] });
    console.log(`Found ${domains.length} domains without coordinates`);
    
    let updatedCount = 0;
    
    for (const domain of domains) {
      const baseCoord = getRandomCoordinate();
      const coord = addSmallOffset(baseCoord.lat, baseCoord.lng, 0.01);
      
      await Domain.findByIdAndUpdate(domain._id, {
        latitude: coord.lat,
        longitude: coord.lng
      });
      
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} domains...`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} domains with coordinates`);
  } catch (error) {
    console.error('Error updating domains:', error);
  }
}

async function updatePlotsWithCoordinates() {
  try {
    console.log('Starting to update plots with coordinates...');
    
    const plots = await Plot.find({ $or: [{ latitude: { $exists: false } }, { latitude: null }] });
    console.log(`Found ${plots.length} plots without coordinates`);
    
    let updatedCount = 0;
    
    for (const plot of plots) {
      const baseCoord = getRandomCoordinate();
      const coord = addSmallOffset(baseCoord.lat, baseCoord.lng, 0.005);
      
      await Plot.findByIdAndUpdate(plot._id, {
        latitude: coord.lat,
        longitude: coord.lng
      });
      
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} plots...`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} plots with coordinates`);
  } catch (error) {
    console.error('Error updating plots:', error);
  }
}

async function updatePlantsWithCoordinates() {
  try {
    console.log('Starting to update plants with coordinates...');
    
    const plants = await Plant.find({ $or: [{ latitude: { $exists: false } }, { latitude: null }] });
    console.log(`Found ${plants.length} plants without coordinates`);
    
    let updatedCount = 0;
    
    for (const plant of plants) {
      // Get the plot coordinates if available
      let coord;
      
      if (plant.plotId) {
        const plot = await Plot.findById(plant.plotId);
        if (plot && plot.latitude && plot.longitude) {
          // Add small offset from plot location
          coord = addSmallOffset(plot.latitude, plot.longitude, 0.001);
        } else {
          // Use random location
          const baseCoord = getRandomCoordinate();
          coord = addSmallOffset(baseCoord.lat, baseCoord.lng, 0.005);
        }
      } else {
        // Use random location
        const baseCoord = getRandomCoordinate();
        coord = addSmallOffset(baseCoord.lat, baseCoord.lng, 0.005);
      }
      
      await Plant.findByIdAndUpdate(plant._id, {
        latitude: coord.lat,
        longitude: coord.lng
      });
      
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} plants...`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} plants with coordinates`);
  } catch (error) {
    console.error('Error updating plants:', error);
  }
}

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Update domains first
    await updateDomainsWithCoordinates();
    
    // Then update plots
    await updatePlotsWithCoordinates();
    
    // Finally update plants
    await updatePlantsWithCoordinates();
    
    console.log('All updates completed successfully!');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { updateDomainsWithCoordinates, updatePlotsWithCoordinates, updatePlantsWithCoordinates };
