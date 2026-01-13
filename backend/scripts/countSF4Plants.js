const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Plant = require('../models/Plant');
const Domain = require('../models/Domain');

async function countSF4Plants() {
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

    // Count all active plants in SF4
    const totalPlants = await Plant.countDocuments({
      domainId: domain._id,
      isActive: true
    });

    console.log(`\n📊 Total Plants in SF4 Domain: ${totalPlants}`);

    // Count by plant type
    const plantTypeCounts = await Plant.aggregate([
      {
        $match: {
          domainId: domain._id,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log(`\n📋 Top 10 Plant Types:`);
    plantTypeCounts.slice(0, 10).forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    // Count by plot
    const plotCounts = await Plant.aggregate([
      {
        $match: {
          domainId: domain._id,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'plots',
          localField: 'plotId',
          foreignField: '_id',
          as: 'plot'
        }
      },
      {
        $unwind: '$plot'
      },
      {
        $group: {
          _id: '$plot.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log(`\n📊 Plants by Plot (top 10):`);
    plotCounts.slice(0, 10).forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Script completed!');
  } catch (error) {
    console.error('❌ Error counting SF4 plants:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
countSF4Plants();

