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

const updateUserEmail = async () => {
  try {
    await connectDB();
    console.log('🔍 Updating superadmin user email...');

    // Find the existing superadmin user
    const user = await User.findOne({ email: 'admin@sanctityferme.com' });
    
    if (user) {
      // Update the email
      user.email = 'superadmin@sanctityferme.com';
      await user.save();
      
      console.log('✅ User email updated successfully:');
      console.log(`   Old Email: admin@sanctityferme.com`);
      console.log(`   New Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      
      console.log('\n📋 Login Credentials:');
      console.log('   Email: superadmin@sanctityferme.com');
      console.log('   Password: SuperAdmin123!');
    } else {
      console.log('❌ User with email admin@sanctityferme.com not found');
    }

  } catch (error) {
    console.error('❌ Error updating user email:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

updateUserEmail();





