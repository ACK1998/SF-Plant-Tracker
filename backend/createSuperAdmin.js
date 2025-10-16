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

const createSuperAdmin = async () => {
  try {
    await connectDB();
    console.log('🔍 Checking for existing superadmin user...');

    // Check if superadmin user already exists
    let superAdmin = await User.findOne({ email: 'superadmin@sanctityferme.com' });
    
    if (superAdmin) {
      console.log('✅ Super admin user already exists:');
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Username: ${superAdmin.username}`);
      console.log(`   Role: ${superAdmin.role}`);
      console.log(`   Active: ${superAdmin.isActive}`);
    } else {
      // Create super admin user
      superAdmin = new User({
        username: 'superadmin',
        email: 'superadmin@sanctityferme.com',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true
      });
      await superAdmin.save();
      console.log('✅ Super admin user created successfully:');
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Username: ${superAdmin.username}`);
      console.log(`   Role: ${superAdmin.role}`);
      console.log(`   Password: SuperAdmin123!`);
    }

    console.log('\n📋 Login Credentials:');
    console.log('   Email: superadmin@sanctityferme.com');
    console.log('   Password: SuperAdmin123!');

  } catch (error) {
    console.error('❌ Error creating super admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

createSuperAdmin();





