const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Domain = require('./models/Domain');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createDomainAdmin = async () => {
  try {
    console.log('🔍 Checking for domain admin user...');
    
    // Check if domain admin user exists
    let domainAdmin = await User.findOne({ email: 'domadmin@sanctityferme.com' });
    
    if (domainAdmin) {
      console.log('✅ Domain admin user already exists');
      console.log('User details:', {
        email: domainAdmin.email,
        role: domainAdmin.role,
        isActive: domainAdmin.isActive,
        organizationId: domainAdmin.organizationId,
        domainId: domainAdmin.domainId
      });
      return;
    }
    
    console.log('❌ Domain admin user not found, creating...');
    
    // Get organization and domain
    const organization = await Organization.findOne({ name: 'Sanctity Ferme' });
    if (!organization) {
      console.log('❌ Organization "Sanctity Ferme" not found. Please run seed data first.');
      return;
    }
    
    const domain = await Domain.findOne({ name: 'Main Garden Domain' });
    if (!domain) {
      console.log('❌ Domain "Main Garden Domain" not found. Please run seed data first.');
      return;
    }
    
    // Create domain admin user
    domainAdmin = new User({
      username: 'domadmin',
      email: 'domadmin@sanctityferme.com',
      password: '1234567',
      firstName: 'Domain',
      lastName: 'Admin',
      role: 'domain_admin',
      organizationId: organization._id,
      domainId: domain._id,
      isActive: true
    });
    
    await domainAdmin.save();
    console.log('✅ Domain admin user created successfully');
    console.log('Login credentials:');
    console.log('  Email: domadmin@sanctityferme.com');
    console.log('  Password: 1234567');
    
  } catch (error) {
    console.error('❌ Error creating domain admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
connectDB().then(createDomainAdmin);
