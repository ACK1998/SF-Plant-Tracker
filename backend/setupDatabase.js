const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');

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
    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@sanctityferme.com',
      password: 'temp123', // Temporary password, will be updated with hash below
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true
    });
    console.log('✅ Super Admin created:', superAdmin.username);

    // Update with pre-hashed password (bypassing pre-save hook)
    const passwordHash = '$2a$10$Ks3xWi0uoINd510Hs/VsdOtHmr7OQtf0TolYheykS1sLYeN12KDiS';
    await User.updateOne(
      { _id: superAdmin._id },
      { $set: { password: passwordHash } }
    );
    console.log('✅ Super Admin password hash set');

    // Update organization with the super admin as creator
    await Organization.findByIdAndUpdate(organization._id, {
      createdBy: superAdmin._id
    });

    // Create org admin user
    console.log('\n=== CREATING ORG ADMIN USER ===');
    const orgAdmin = await User.create({
      username: 'orgadmin',
      email: 'orgadmin@sanctityferme.com',
      password: 'org123',
      firstName: 'Org',
      lastName: 'Admin',
      role: 'org_admin',
      organizationId: organization._id,
      isActive: true
    });
    console.log('✅ Org Admin created:', orgAdmin.username);

    // Create domain admin user
    console.log('\n=== CREATING DOMAIN ADMIN USER ===');
    const domainAdmin = await User.create({
      username: 'domainadmin',
      email: 'domainadmin@sanctityferme.com',
      password: 'domain123',
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
    const appUser = await User.create({
      username: 'appuser',
      email: 'appuser@sanctityferme.com',
      password: 'app123',
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

    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Super Admin: superadmin@sanctityferme.com / (password hash set)');
    console.log('Org Admin: orgadmin@sanctityferme.com / org123');
    console.log('Domain Admin: domainadmin@sanctityferme.com / domain123');
    console.log('App User: appuser@sanctityferme.com / app123');

    await mongoose.connection.close();
    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

setupDatabase();
