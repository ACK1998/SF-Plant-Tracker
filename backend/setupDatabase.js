const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
require('dotenv').config();

async function setupDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas database');

    // Create organization first
    console.log('\n=== CREATING ORGANIZATION ===');
    const organization = await Organization.create({
      name: 'Sanctity Ferme',
      description: 'Main organization for plant tracking',
      createdBy: new mongoose.Types.ObjectId() // We'll update this after creating the user
    });
    console.log('✅ Organization created:', organization.name);

    // Create super admin user
    console.log('\n=== CREATING SUPER ADMIN USER ===');
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@sanctityferme.com';
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD;
    
    if (!superAdminPassword) {
      throw new Error('SUPERADMIN_PASSWORD environment variable is required');
    }
    
    const superAdmin = await User.create({
      username: 'superadmin',
      email: superAdminEmail,
      password: superAdminPassword, // Will be hashed by pre-save hook
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true
    });
    console.log('✅ Super Admin created:', superAdmin.username);

    // Update organization with the super admin as creator
    await Organization.findByIdAndUpdate(organization._id, {
      createdBy: superAdmin._id
    });

    // Create org admin user
    console.log('\n=== CREATING ORG ADMIN USER ===');
    const orgAdminEmail = process.env.ORGADMIN_EMAIL || 'orgadmin@sanctityferme.com';
    const orgAdminPassword = process.env.ORGADMIN_PASSWORD;
    
    if (!orgAdminPassword) {
      throw new Error('ORGADMIN_PASSWORD environment variable is required');
    }
    
    const orgAdmin = await User.create({
      username: 'orgadmin',
      email: orgAdminEmail,
      password: orgAdminPassword, // Will be hashed by pre-save hook
      firstName: 'Org',
      lastName: 'Admin',
      role: 'org_admin',
      organizationId: organization._id,
      isActive: true
    });
    console.log('✅ Org Admin created:', orgAdmin.username);

    // Create domain admin user
    console.log('\n=== CREATING DOMAIN ADMIN USER ===');
    const domainAdminEmail = process.env.DOMAINADMIN_EMAIL || 'domainadmin@sanctityferme.com';
    const domainAdminPassword = process.env.DOMAINADMIN_PASSWORD;
    
    if (!domainAdminPassword) {
      throw new Error('DOMAINADMIN_PASSWORD environment variable is required');
    }
    
    const domainAdmin = await User.create({
      username: 'domainadmin',
      email: domainAdminEmail,
      password: domainAdminPassword, // Will be hashed by pre-save hook
      firstName: 'Domain',
      lastName: 'Admin',
      role: 'domain_admin',
      organizationId: organization._id,
      domainId: new mongoose.Types.ObjectId(), // Mock domain ID
      isActive: true
    });
    console.log('✅ Domain Admin created:', domainAdmin.username);

    // Create application user
    console.log('\n=== CREATING APPLICATION USER ===');
    const appUserEmail = process.env.APPUSER_EMAIL || 'appuser@sanctityferme.com';
    const appUserPassword = process.env.APPUSER_PASSWORD;
    
    if (!appUserPassword) {
      throw new Error('APPUSER_PASSWORD environment variable is required');
    }
    
    const appUser = await User.create({
      username: 'appuser',
      email: appUserEmail,
      password: appUserPassword, // Will be hashed by pre-save hook
      firstName: 'App',
      lastName: 'User',
      role: 'application_user',
      organizationId: organization._id,
      domainId: new mongoose.Types.ObjectId(), // Mock domain ID
      plotId: new mongoose.Types.ObjectId(), // Mock plot ID
      isActive: true
    });
    console.log('✅ Application User created:', appUser.username);

    console.log('\n=== DATABASE SETUP COMPLETE ===');
    console.log('✅ Organization:', organization.name);
    console.log('✅ Super Admin:', superAdmin.username, `(${superAdmin._id})`);
    console.log('✅ Org Admin:', orgAdmin.username, `(${orgAdmin._id})`);
    console.log('✅ Domain Admin:', domainAdmin.username, `(${domainAdmin._id})`);
    console.log('✅ App User:', appUser.username, `(${appUser._id})`);
    console.log('✅ Users created successfully. Credentials are stored securely.');

    await mongoose.connection.close();
    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

setupDatabase();
