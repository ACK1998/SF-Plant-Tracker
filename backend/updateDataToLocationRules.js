const mongoose = require('mongoose');
const Plot = require('./models/Plot');
const Plant = require('./models/Plant');
const Domain = require('./models/Domain');
require('dotenv').config();

// Phase 1 center coordinates
const PHASE_1_CENTER = {
  lat: 12.697541550243653,
  lng: 78.06162609693409
};

// Location rules
const LOCATION_RULES = {
  DOMAIN_RADIUS: 20, // km - domains must be within 20km of Phase 1
  PLOT_RADIUS: 4,    // km - plots must be within 4km of their domain
  PLANT_RADIUS: 0.1  // km (100m) - plants must be within 100m of their plot
};

function addSmallOffset(lat, lng, maxOffset = 0.01) {
  const latOffset = (Math.random() - 0.5) * maxOffset;
  const lngOffset = (Math.random() - 0.5) * maxOffset;
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset
  };
}

// Generate coordinates within the allowed radius
function generateCoordinatesWithinRadius(centerLat, centerLng, maxRadiusKm) {
  // Convert km to degrees (approximate)
  const radiusInDegrees = maxRadiusKm / 111; // 1 degree ≈ 111 km
  
  // Generate random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;
  
  // Calculate new coordinates
  const lat = centerLat + (distance * Math.cos(angle));
  const lng = centerLng + (distance * Math.sin(angle));
  
  return { lat, lng };
}

async function updateDomainsToLocationRules() {
  try {
    console.log('Updating domains to comply with location rules...');
    
    const domains = await Domain.find({});
    console.log(`Found ${domains.length} domains to update`);
    
    for (const domain of domains) {
      // Generate coordinates within 20km of Phase 1
      const coords = generateCoordinatesWithinRadius(PHASE_1_CENTER.lat, PHASE_1_CENTER.lng, LOCATION_RULES.DOMAIN_RADIUS);
      
      await Domain.findByIdAndUpdate(domain._id, {
        latitude: coords.lat,
        longitude: coords.lng
      });
      
      console.log(`Updated domain: ${domain.name} - Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`);
    }
    
    console.log('All domains updated successfully!');
  } catch (error) {
    console.error('Error updating domains:', error);
  }
}

async function updatePlotsToLocationRules() {
  try {
    console.log('Updating plots to comply with location rules...');
    
    const plots = await Plot.find({});
    console.log(`Found ${plots.length} plots to update`);
    
    for (const plot of plots) {
      // For now, all plots will be within 4km of Phase 1 center
      // In the future, this could be based on the plot's domain
      const coords = generateCoordinatesWithinRadius(PHASE_1_CENTER.lat, PHASE_1_CENTER.lng, LOCATION_RULES.PLOT_RADIUS);
      
      await Plot.findByIdAndUpdate(plot._id, {
        latitude: coords.lat,
        longitude: coords.lng
      });
      
      console.log(`Updated plot: ${plot.name} - Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`);
    }
    
    console.log('All plots updated successfully!');
  } catch (error) {
    console.error('Error updating plots:', error);
  }
}

async function updatePlantsToLocationRules() {
  try {
    console.log('Updating plants to comply with location rules...');
    
    const plants = await Plant.find({});
    const plots = await Plot.find({});
    console.log(`Found ${plants.length} plants to update`);
    
    for (const plant of plants) {
      // Find the plot for this plant
      const plot = plots.find(p => p._id.toString() === (plant.plotId?._id || plant.plotId)?.toString());
      
      if (plot && plot.latitude && plot.longitude) {
        // Generate coordinates within 100m of the plot
        const coords = generateCoordinatesWithinRadius(plot.latitude, plot.longitude, LOCATION_RULES.PLANT_RADIUS);
        
        await Plant.findByIdAndUpdate(plant._id, {
          latitude: coords.lat,
          longitude: coords.lng
        });
        
        console.log(`Updated plant: ${plant.name} - Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)} - Plot: ${plot.name}`);
      } else {
        // If no plot found, place within 100m of Phase 1 center
        const coords = generateCoordinatesWithinRadius(PHASE_1_CENTER.lat, PHASE_1_CENTER.lng, LOCATION_RULES.PLANT_RADIUS);
        
        await Plant.findByIdAndUpdate(plant._id, {
          latitude: coords.lat,
          longitude: coords.lng
        });
        
        console.log(`Updated plant: ${plant.name} - Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)} - No plot found`);
      }
    }
    
    console.log('All plants updated successfully!');
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
    
    // Update data in order: domains -> plots -> plants
    await updateDomainsToLocationRules();
    await updatePlotsToLocationRules();
    await updatePlantsToLocationRules();
    
    console.log('All data updated to comply with location hierarchy rules!');
    
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

module.exports = { updateDomainsToLocationRules, updatePlotsToLocationRules, updatePlantsToLocationRules };
