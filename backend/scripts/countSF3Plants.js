const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Domain = require('../models/Domain');
const Plant = require('../models/Plant');

async function countSF3Plants() {
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
    console.log('✅ Found domain: SF3');

    // Count total active plants
    const totalPlants = await Plant.countDocuments({ 
      domainId: domain._id,
      isActive: true 
    });

    // Count by category
    const byCategory = await Plant.aggregate([
      { 
        $match: { 
          domainId: domain._id,
          isActive: true 
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Count by plot (top 10)
    const byPlot = await Plant.aggregate([
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
      },
      {
        $limit: 10
      }
    ]);

    console.log(`\n📊 Total plants in SF3 domain: ${totalPlants}`);
    
    console.log(`\n📈 Breakdown by Category:`);
    byCategory.forEach(item => {
      console.log(`   ${item._id}: ${item.count} plants`);
    });

    console.log(`\n📋 Top 10 Plots by Plant Count:`);
    byPlot.forEach(item => {
      console.log(`   ${item._id}: ${item.count} plants`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error counting SF3 plants:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
countSF3Plants();

