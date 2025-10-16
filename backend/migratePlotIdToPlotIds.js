const mongoose = require('mongoose');
const User = require('./models/User');

async function migratePlotIdToPlotIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sanctity-ferme');
    console.log('Connected to MongoDB');

    // Find all users that have plotId but no plotIds
    const usersToMigrate = await User.find({
      plotId: { $exists: true, $ne: null },
      $or: [
        { plotIds: { $exists: false } },
        { plotIds: { $size: 0 } }
      ]
    });

    console.log(`Found ${usersToMigrate.length} users to migrate`);

    for (const user of usersToMigrate) {
      console.log(`Migrating user: ${user.username} (${user._id})`);
      console.log(`  Current plotId: ${user.plotId}`);
      
      // Convert single plotId to plotIds array
      const plotIds = [user.plotId];
      
      // Update the user
      await User.findByIdAndUpdate(user._id, {
        $set: { plotIds },
        $unset: { plotId: 1 }
      });
      
      console.log(`  Migrated to plotIds: ${plotIds}`);
    }

    console.log('Migration completed successfully');
    
    // Verify migration
    const migratedUsers = await User.find({
      plotIds: { $exists: true, $ne: [] }
    });
    
    console.log(`Verification: ${migratedUsers.length} users now have plotIds`);
    
    // Check for any remaining plotId fields
    const remainingPlotIdUsers = await User.find({
      plotId: { $exists: true, $ne: null }
    });
    
    if (remainingPlotIdUsers.length > 0) {
      console.log(`Warning: ${remainingPlotIdUsers.length} users still have plotId field`);
    } else {
      console.log('All users successfully migrated from plotId to plotIds');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migratePlotIdToPlotIds();
}

module.exports = migratePlotIdToPlotIds;
