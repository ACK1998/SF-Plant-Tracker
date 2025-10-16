const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Domain = require('./models/Domain');
const Plot = require('./models/Plot');
const Plant = require('./models/Plant');

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

const seedData = async () => {
  try {
    console.log('🌱 Starting data seeding...');

    // Check if data already exists
    const existingPlants = await Plant.countDocuments();
    if (existingPlants > 0) {
      console.log('✅ Data already exists, skipping seeding');
      return;
    }

    // Create super admin user if not exists
    let superAdmin = await User.findOne({ email: 'superadmin@sanctityferme.com' });
    if (!superAdmin) {
      superAdmin = new User({
        username: 'superadmin',
        email: 'superadmin@sanctityferme.com',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin'
      });
      await superAdmin.save();
      console.log('✅ Super admin user created');
    }

    // Create organization
    const organization = new Organization({
      name: 'Sanctity Ferme',
      description: 'A sustainable farming organization focused on organic plant cultivation',
      address: {
        street: '123 Farm Road',
        city: 'Green Valley',
        state: 'CA',
        zipCode: '90210',
        country: 'United States'
      },
      contactInfo: {
        phone: '+1-555-0123',
        email: 'info@sanctityferme.com',
        website: 'https://sanctityferme.com'
      },
      createdBy: superAdmin._id
    });
    await organization.save();
    console.log('✅ Organization created');

    // Create domain
    const domain = new Domain({
      name: 'Main Garden Domain',
      description: 'Primary cultivation area for vegetables and herbs',
      organizationId: organization._id,
      location: 'North Field',
      size: 5000,
      soilType: 'loam',
      climate: 'temperate',
      createdBy: superAdmin._id
    });
    await domain.save();
    console.log('✅ Domain created');

    // Create plots
    const plot1 = new Plot({
      name: 'Vegetable Plot A',
      description: 'Primary vegetable growing area',
      domainId: domain._id,
      organizationId: organization._id,
      size: 200,
      soilType: 'loam',
      irrigationType: 'drip',
      sunExposure: 'full',
      createdBy: superAdmin._id
    });
    await plot1.save();

    const plot2 = new Plot({
      name: 'Orchard Plot B',
      description: 'Fruit tree cultivation area',
      domainId: domain._id,
      organizationId: organization._id,
      size: 300,
      soilType: 'clay-loam',
      irrigationType: 'sprinkler',
      sunExposure: 'full',
      createdBy: superAdmin._id
    });
    await plot2.save();

    const plot3 = new Plot({
      name: 'Herb Garden Plot C',
      description: 'Medicinal and culinary herbs',
      domainId: domain._id,
      organizationId: organization._id,
      size: 150,
      soilType: 'sandy-loam',
      irrigationType: 'drip',
      sunExposure: 'partial',
      createdBy: superAdmin._id
    });
    await plot3.save();
    console.log('✅ 3 plots created');

    // Create plants
    const plants = [
      // Original plants (Plot 1)
      {
        name: 'Tomato Plant #1',
        type: 'Tomato',
        variety: 'Roma',
        category: 'plant',
        plotId: plot1._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2024-01-15'),
        plantedBy: superAdmin._id,
        planter: 'John Smith',
        health: 'excellent',
        growthStage: 'flowering',
        image: '🍅',
        expectedHarvestDate: new Date('2024-04-15'),
        statusHistory: [{
          date: new Date('2024-01-15'),
          status: 'planted',
          health: 'excellent',
          growthStage: 'seedling',
          image: '🍅',
          notes: 'Planting completed successfully',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Basil Plant',
        type: 'Basil',
        variety: 'Sweet Basil',
        category: 'plant',
        plotId: plot1._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2024-01-10'),
        plantedBy: superAdmin._id,
        planter: 'Sarah Johnson',
        health: 'good',
        growthStage: 'mature',
        image: '🌿',
        expectedHarvestDate: new Date('2024-03-10'),
        statusHistory: [{
          date: new Date('2024-01-10'),
          status: 'planted',
          health: 'good',
          growthStage: 'seedling',
          image: '🌿',
          notes: 'Basil seeds planted',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Apple Tree #1',
        type: 'Apple',
        variety: 'Honeycrisp',
        category: 'tree',
        plotId: plot1._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2022-03-15'),
        plantedBy: superAdmin._id,
        planter: 'Michael Brown',
        health: 'excellent',
        growthStage: 'mature',
        image: '🍎',
        expectedHarvestDate: new Date('2024-09-15'),
        statusHistory: [{
          date: new Date('2022-03-15'),
          status: 'planted',
          health: 'excellent',
          growthStage: 'seedling',
          image: '🍎',
          notes: 'Apple tree planted',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Lemon Tree',
        type: 'Lemon',
        variety: 'Meyer',
        category: 'tree',
        plotId: plot1._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2022-01-20'),
        plantedBy: superAdmin._id,
        planter: 'Emily Davis',
        health: 'good',
        growthStage: 'mature',
        image: '🍋',
        expectedHarvestDate: new Date('2024-08-20'),
        statusHistory: [{
          date: new Date('2022-01-20'),
          status: 'planted',
          health: 'good',
          growthStage: 'seedling',
          image: '🍋',
          notes: 'Lemon tree planted',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Blueberry Bush #1',
        type: 'Blueberry',
        variety: 'Highbush',
        category: 'plant',
        plotId: plot1._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2023-05-10'),
        plantedBy: superAdmin._id,
        planter: 'David Wilson',
        health: 'good',
        growthStage: 'mature',
        image: '🫐',
        expectedHarvestDate: new Date('2024-06-10'),
        statusHistory: [{
          date: new Date('2023-05-10'),
          status: 'planted',
          health: 'good',
          growthStage: 'seedling',
          image: '🫐',
          notes: 'Blueberry bush planted',
          updatedBy: superAdmin._id,
        }]
      },
      
      // New Plants - Plot 2 (Orchard)
      {
        name: 'Orange Tree',
        type: 'Orange',
        variety: 'Valencia',
        category: 'tree',
        plotId: plot2._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2023-02-15'),
        plantedBy: superAdmin._id,
        planter: 'Lisa Anderson',
        health: 'excellent',
        growthStage: 'mature',
        image: '🍊',
        expectedHarvestDate: new Date('2024-11-15'),
        statusHistory: [{
          date: new Date('2023-02-15'),
          status: 'planted',
          health: 'excellent',
          growthStage: 'seedling',
          image: '🍊',
          notes: 'Orange tree planted in orchard',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Peach Tree',
        type: 'Peach',
        variety: 'Elberta',
        category: 'tree',
        plotId: plot2._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2023-03-20'),
        plantedBy: superAdmin._id,
        planter: 'Robert Taylor',
        health: 'good',
        growthStage: 'mature',
        image: '🍑',
        expectedHarvestDate: new Date('2024-07-20'),
        statusHistory: [{
          date: new Date('2023-03-20'),
          status: 'planted',
          health: 'good',
          growthStage: 'seedling',
          image: '🍑',
          notes: 'Peach tree planted',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Cherry Tree',
        type: 'Cherry',
        variety: 'Bing',
        category: 'tree',
        plotId: plot2._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2023-01-10'),
        plantedBy: superAdmin._id,
        planter: 'Jennifer Martinez',
        health: 'excellent',
        growthStage: 'mature',
        image: '🍒',
        expectedHarvestDate: new Date('2024-06-10'),
        statusHistory: [{
          date: new Date('2023-01-10'),
          status: 'planted',
          health: 'excellent',
          growthStage: 'seedling',
          image: '🍒',
          notes: 'Cherry tree planted',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Plum Tree',
        type: 'Plum',
        variety: 'Santa Rosa',
        category: 'tree',
        plotId: plot2._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2023-04-05'),
        plantedBy: superAdmin._id,
        planter: 'Christopher Lee',
        health: 'good',
        growthStage: 'mature',
        image: '🫐',
        expectedHarvestDate: new Date('2024-08-05'),
        statusHistory: [{
          date: new Date('2023-04-05'),
          status: 'planted',
          health: 'good',
          growthStage: 'seedling',
          image: '🫐',
          notes: 'Plum tree planted',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Pear Tree',
        type: 'Pear',
        variety: 'Bartlett',
        category: 'tree',
        plotId: plot2._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2023-02-28'),
        plantedBy: superAdmin._id,
        planter: 'Amanda Garcia',
        health: 'excellent',
        growthStage: 'mature',
        image: '🍐',
        expectedHarvestDate: new Date('2024-09-28'),
        statusHistory: [{
          date: new Date('2023-02-28'),
          status: 'planted',
          health: 'excellent',
          growthStage: 'seedling',
          image: '🍐',
          notes: 'Pear tree planted',
          updatedBy: superAdmin._id,
        }]
      },
      
      // New Plants - Plot 3 (Herb Garden)
      {
        name: 'Rosemary Plant',
        type: 'Rosemary',
        variety: 'Tuscan Blue',
        category: 'plant',
        plotId: plot3._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2024-02-01'),
        plantedBy: superAdmin._id,
        planter: 'Maria Rodriguez',
        health: 'excellent',
        growthStage: 'mature',
        image: '🌿',
        expectedHarvestDate: new Date('2024-05-01'),
        statusHistory: [{
          date: new Date('2024-02-01'),
          status: 'planted',
          health: 'excellent',
          growthStage: 'seedling',
          image: '🌿',
          notes: 'Rosemary planted in herb garden',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Thyme Plant',
        type: 'Thyme',
        variety: 'English Thyme',
        category: 'plant',
        plotId: plot3._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2024-02-05'),
        plantedBy: superAdmin._id,
        planter: 'Thomas White',
        health: 'good',
        growthStage: 'mature',
        image: '🌿',
        expectedHarvestDate: new Date('2024-04-05'),
        statusHistory: [{
          date: new Date('2024-02-05'),
          status: 'planted',
          health: 'good',
          growthStage: 'seedling',
          image: '🌿',
          notes: 'Thyme planted',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Mint Plant',
        type: 'Mint',
        variety: 'Spearmint',
        category: 'plant',
        plotId: plot3._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2024-01-25'),
        plantedBy: superAdmin._id,
        planter: 'Sofia Patel',
        health: 'excellent',
        growthStage: 'mature',
        image: '🌿',
        expectedHarvestDate: new Date('2024-03-25'),
        statusHistory: [{
          date: new Date('2024-01-25'),
          status: 'planted',
          health: 'excellent',
          growthStage: 'seedling',
          image: '🌿',
          notes: 'Mint planted',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Lavender Plant',
        type: 'Lavender',
        variety: 'English Lavender',
        category: 'plant',
        plotId: plot3._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2024-02-10'),
        plantedBy: superAdmin._id,
        planter: 'Daniel Kim',
        health: 'good',
        growthStage: 'mature',
        image: '💜',
        expectedHarvestDate: new Date('2024-06-10'),
        statusHistory: [{
          date: new Date('2024-02-10'),
          status: 'planted',
          health: 'good',
          growthStage: 'seedling',
          image: '💜',
          notes: 'Lavender planted',
          updatedBy: superAdmin._id,
        }]
      },
      {
        name: 'Sage Plant',
        type: 'Sage',
        variety: 'Common Sage',
        category: 'plant',
        plotId: plot3._id,
        domainId: domain._id,
        organizationId: organization._id,
        plantedDate: new Date('2024-01-30'),
        plantedBy: superAdmin._id,
        planter: 'Rachel Green',
        health: 'excellent',
        growthStage: 'mature',
        image: '🌿',
        expectedHarvestDate: new Date('2024-04-30'),
        statusHistory: [{
          date: new Date('2024-01-30'),
          status: 'planted',
          health: 'excellent',
          growthStage: 'seedling',
          image: '🌿',
          notes: 'Sage planted',
          updatedBy: superAdmin._id,
        }]
      }
    ];

    for (const plantData of plants) {
      const plant = new Plant(plantData);
      await plant.save();
    }
    console.log(`✅ ${plants.length} plants created`);

    console.log('🎉 Data seeding completed successfully!');
    console.log('📊 Sample data includes:');
    console.log('   - 1 Organization (Sanctity Ferme)');
    console.log('   - 1 Domain (Main Garden Domain)');
    console.log('   - 3 Plots (Vegetable Plot A, Orchard Plot B, Herb Garden Plot C)');
    console.log('   - 15 Plants (5 original + 10 new)');
    console.log('     • 5 Trees: Apple, Lemon, Orange, Peach, Cherry, Plum, Pear');
    console.log('     • 8 Plants: Tomato, Basil, Blueberry, Rosemary, Thyme, Mint, Lavender, Sage');
    console.log('   - 1 Super Admin user');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  connectDB().then(() => {
    seedData();
  });
}

module.exports = { seedData }; 