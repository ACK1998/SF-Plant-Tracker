const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plant = require('../models/Plant');
const Domain = require('../models/Domain');
const Plot = require('../models/Plot');

async function listSF4PlotsWithCounts() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the SF4 domain
    const domain = await Domain.findOne({ name: 'SF4' });
    if (!domain) {
      throw new Error('SF4 domain not found.');
    }
    console.log('✅ Found domain:', domain.name, `(${domain._id})`);

    // Get all plots in SF4 domain
    const plots = await Plot.find({
      domainId: domain._id,
      isActive: true
    }).sort({ name: 1 }).select('name _id');

    console.log(`\n📋 Found ${plots.length} active plots in SF4 domain\n`);

    // Count plants for each plot
    const plotCounts = await Plant.aggregate([
      {
        $match: {
          domainId: domain._id,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$plotId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of plotId to count
    const countMap = new Map();
    plotCounts.forEach(item => {
      countMap.set(item._id.toString(), item.count);
    });

    // Create array of plot info with counts
    const plotInfo = plots.map(plot => ({
      name: plot.name,
      count: countMap.get(plot._id.toString()) || 0
    }));

    // Sort by plot name (natural sort)
    plotInfo.sort((a, b) => {
      // Extract numbers from plot names for natural sorting
      const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });

    // Display results
    console.log('Plot Name | Total Plants');
    console.log('----------|-------------');
    let totalPlants = 0;
    plotInfo.forEach(plot => {
      console.log(`${plot.name.padEnd(20)} | ${plot.count}`);
      totalPlants += plot.count;
    });

    console.log('\n----------|-------------');
    console.log(`Total     | ${totalPlants}`);

    await mongoose.connection.close();
    console.log('\n✅ Script completed!');
  } catch (error) {
    console.error('❌ Error listing SF4 plots:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
listSF4PlotsWithCounts();

