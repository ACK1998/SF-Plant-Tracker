const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

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

const updateUserPassword = async () => {
  try {
    await connectDB();
    console.log('🔍 Updating superadmin user password...');

    // Find the existing superadmin user
    const user = await User.findOne({ email: 'superadmin@sanctityferme.com' });
    
    if (user) {
      // Update the password - this will automatically hash it
      user.password = 'SuperAdmin123!';
      await user.save();
      
      console.log('✅ User password updated successfully:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: SuperAdmin123! (hashed)`);
      
      console.log('\n📋 Login Credentials:');
      console.log('   Email: superadmin@sanctityferme.com');
      console.log('   Password: SuperAdmin123!');
    } else {
      console.log('❌ User with email superadmin@sanctityferme.com not found');
    }

  } catch (error) {
    console.error('❌ Error updating user password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

updateUserPassword();



