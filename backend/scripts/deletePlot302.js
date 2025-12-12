const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plot = require('../models/Plot');
const Plant = require('../models/Plant');
const Domain = require('../models/Domain');

async function deletePlot302() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the SF3 domain
    const domain = await Domain.findOne({ name: 'SF3' });
    if (!domain) {
      throw new Error('SF3 domain not found.');
    }
    console.log('✅ Found domain:', domain.name);

    // Find Plot 302 (try different name formats)
    const possibleNames = [
      'Plot 302',
      'Plot302',
      'Plot: 302',
      'Plot:302'
    ];

    let plot = null;
    let foundFormat = null;

    for (const plotName of possibleNames) {
      plot = await Plot.findOne({
        name: plotName,
        domainId: domain._id
      });

      if (plot) {
        foundFormat = plotName;
        break;
      }
    }

    if (!plot) {
      console.log('❌ Plot 302 not found in SF3 domain');
      await mongoose.connection.close();
      return;
    }

    console.log(`✅ Found plot: "${plot.name}" (${plot._id}) - matched format: "${foundFormat}"`);

    // Check if there are any plants associated with this plot
    const plantCount = await Plant.countDocuments({
      plotId: plot._id,
      isActive: true
    });

    console.log(`📊 Found ${plantCount} active plants in Plot 302`);

    if (plantCount > 0) {
      // Soft delete the plants first
      const plantUpdateResult = await Plant.updateMany(
        { plotId: plot._id, isActive: true },
        { isActive: false }
      );
      console.log(`✅ Soft deleted ${plantUpdateResult.modifiedCount} plants`);
    }

    // Soft delete the plot
    plot.isActive = false;
    await plot.save();

    console.log(`✅ Plot 302 has been soft deleted (isActive set to false)`);

    // Verify deletion
    const verifyPlot = await Plot.findOne({
      _id: plot._id,
      isActive: true
    });

    if (!verifyPlot) {
      console.log('✅ Verification: Plot 302 is no longer active');
    } else {
      console.log('⚠️  Warning: Plot 302 is still active');
    }

    await mongoose.connection.close();
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Error deleting Plot 302:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
deletePlot302();

