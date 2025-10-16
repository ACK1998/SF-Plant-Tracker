const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plant = require('./models/Plant');
const Plot = require('./models/Plot');
const Domain = require('./models/Domain');
const Organization = require('./models/Organization');

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

const verifyMapData = async () => {
  try {
    await connectDB();
    console.log('🔍 Verifying map data integrity...\n');

    // Check Organizations
    const organizations = await Organization.find();
    console.log(`📊 Organizations: ${organizations.length}`);
    organizations.forEach(org => {
      console.log(`   - ${org.name} (ID: ${org._id})`);
    });

    // Check Domains
    const domains = await Domain.find();
    console.log(`\n🏢 Domains: ${domains.length}`);
    domains.forEach(domain => {
      console.log(`   - ${domain.name} (ID: ${domain._id})`);
      console.log(`     Organization: ${domain.organizationId}`);
      console.log(`     Coordinates: ${domain.latitude}, ${domain.longitude}`);
      console.log(`     Active: ${domain.isActive}`);
    });

    // Check Plots
    const plots = await Plot.find();
    console.log(`\n🏞️ Plots: ${plots.length}`);
    plots.forEach(plot => {
      console.log(`   - ${plot.name} (ID: ${plot._id})`);
      console.log(`     Domain: ${plot.domainId}`);
      console.log(`     Organization: ${plot.organizationId}`);
      console.log(`     Coordinates: ${plot.latitude}, ${plot.longitude}`);
      console.log(`     Active: ${plot.isActive}`);
    });

    // Check Plants
    const plants = await Plant.find();
    console.log(`\n🌱 Plants: ${plants.length}`);
    plants.forEach(plant => {
      console.log(`   - ${plant.name} (ID: ${plant._id})`);
      console.log(`     Plot: ${plant.plotId}`);
      console.log(`     Type: ${plant.type}`);
      console.log(`     Variety: ${plant.variety}`);
      console.log(`     Coordinates: ${plant.latitude}, ${plant.longitude}`);
      console.log(`     Active: ${plant.isActive}`);
    });

    // Check for orphaned data
    console.log('\n🔍 Checking for orphaned data...');
    
    // Plants without valid plot references
    const orphanedPlants = plants.filter(plant => {
      const plot = plots.find(p => p._id.toString() === plant.plotId?.toString());
      return !plot;
    });
    
    if (orphanedPlants.length > 0) {
      console.log(`❌ Found ${orphanedPlants.length} plants with invalid plot references:`);
      orphanedPlants.forEach(plant => {
        console.log(`   - ${plant.name} (Plot ID: ${plant.plotId})`);
      });
    } else {
      console.log('✅ All plants have valid plot references');
    }

    // Plots without valid domain references
    const orphanedPlots = plots.filter(plot => {
      const domain = domains.find(d => d._id.toString() === plot.domainId?.toString());
      return !domain;
    });
    
    if (orphanedPlots.length > 0) {
      console.log(`❌ Found ${orphanedPlots.length} plots with invalid domain references:`);
      orphanedPlots.forEach(plot => {
        console.log(`   - ${plot.name} (Domain ID: ${plot.domainId})`);
      });
    } else {
      console.log('✅ All plots have valid domain references');
    }

    // Check coordinate ranges (should be around the Phase 1 area)
    console.log('\n📍 Checking coordinate ranges...');
    const allLatitudes = [...domains.map(d => d.latitude), ...plots.map(p => p.latitude), ...plants.map(p => p.latitude)].filter(Boolean);
    const allLongitudes = [...domains.map(d => d.longitude), ...plots.map(p => p.longitude), ...plants.map(p => p.longitude)].filter(Boolean);
    
    if (allLatitudes.length > 0) {
      const minLat = Math.min(...allLatitudes);
      const maxLat = Math.max(...allLatitudes);
      const minLng = Math.min(...allLongitudes);
      const maxLng = Math.max(...allLongitudes);
      
      console.log(`   Latitude range: ${minLat} to ${maxLat}`);
      console.log(`   Longitude range: ${minLng} to ${maxLng}`);
      
      // Check if coordinates are in the expected Phase 1 area
      const phase1Lat = 12.684582467948083;
      const phase1Lng = 78.0549622542717;
      const tolerance = 0.1; // ~11km radius
      
      const inPhase1Area = allLatitudes.every(lat => 
        Math.abs(lat - phase1Lat) < tolerance
      ) && allLongitudes.every(lng => 
        Math.abs(lng - phase1Lng) < tolerance
      );
      
      if (inPhase1Area) {
        console.log('✅ All coordinates are in the expected Phase 1 area');
      } else {
        console.log('⚠️ Some coordinates may be outside the expected Phase 1 area');
      }
    }

    console.log('\n✅ Map data verification completed!');

  } catch (error) {
    console.error('❌ Error verifying map data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

verifyMapData();



