const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Domain = require('../models/Domain');
const Plot = require('../models/Plot');
const Plant = require('../models/Plant');
const PlantType = require('../models/PlantType');

class TestDataFactory {
  constructor() {
    this.testData = {
      users: [],
      organizations: [],
      domains: [],
      plots: [],
      plants: [],
      plantTypes: []
    };
  }

  // Create a super admin user (no organization required)
  async createSuperAdmin() {
    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@test.com',
      password: 'password123',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin'
    });
    
    this.testData.users.push(superAdmin);
    return superAdmin;
  }

  // Create an organization with a super admin
  async createOrganization(superAdmin) {
    const organization = await Organization.create({
      name: 'Test Organization',
      description: 'Test organization for testing',
      createdBy: superAdmin._id
    });
    
    this.testData.organizations.push(organization);
    return organization;
  }

  // Create an org admin user
  async createOrgAdmin(organization) {
    const orgAdmin = await User.create({
      username: 'orgadmin',
      email: 'orgadmin@test.com',
      password: 'password123',
      firstName: 'Org',
      lastName: 'Admin',
      role: 'org_admin',
      organizationId: organization._id
    });
    
    this.testData.users.push(orgAdmin);
    return orgAdmin;
  }

  // Create a domain admin user
  async createDomainAdmin(organization, domainId) {
    const domainAdmin = await User.create({
      username: 'domainadmin',
      email: 'domainadmin@test.com',
      password: 'password123',
      firstName: 'Domain',
      lastName: 'Admin',
      role: 'domain_admin',
      organizationId: organization._id,
      domainId: domainId
    });
    
    this.testData.users.push(domainAdmin);
    return domainAdmin;
  }

  // Create an application user
  async createApplicationUser(organization, domainId, plotId) {
    const appUser = await User.create({
      username: 'appuser',
      email: 'appuser@test.com',
      password: 'password123',
      firstName: 'App',
      lastName: 'User',
      role: 'application_user',
      organizationId: organization._id,
      domainId: domainId,
      plotIds: [plotId]
    });
    
    this.testData.users.push(appUser);
    return appUser;
  }

  // Create a domain
  async createDomain(organization, createdBy) {
    const domain = await Domain.create({
      name: 'Test Domain',
      description: 'Test domain for testing',
      location: 'Test Location',
      size: 1000,
      soilType: 'loam',
      climate: 'temperate',
      organizationId: organization._id,
      createdBy: createdBy._id
    });
    
    this.testData.domains.push(domain);
    return domain;
  }

  // Create a plot
  async createPlot(organization, domainId, name, createdBy) {
    const plot = await Plot.create({
      name: name || 'Test Plot',
      description: 'Test plot for testing',
      size: 100,
      location: 'Test Location',
      soilType: 'loam',
      domainId: domainId,
      organizationId: organization._id,
      createdBy: createdBy._id
    });
    
    this.testData.plots.push(plot);
    return plot;
  }

  // Create a plant type
  async createPlantType(organization, createdBy) {
    const plantType = await PlantType.create({
      name: 'Test Plant Type',
      category: 'vegetable',
      emoji: '🥕',
      description: 'Test plant type for testing',
      organizationId: organization._id,
      createdBy: createdBy._id
    });
    
    this.testData.plantTypes.push(plantType);
    return plantType;
  }

  // Create a plant
  async createPlant(organization, domainId, plotId, plantedBy, plantType) {
    const plant = await Plant.create({
      name: 'Test Plant',
      type: plantType.name,
      category: 'vegetable',
      plotId: plotId,
      domainId: domainId,
      organizationId: organization._id,
      plantedDate: new Date(),
      plantedBy: plantedBy._id,
      planter: `${plantedBy.firstName} ${plantedBy.lastName}`,
      health: 'excellent',
      growthStage: 'seedling'
    });
    
    this.testData.plants.push(plant);
    return plant;
  }

  // Create complete test setup
  async createTestSetup() {
    // 1. Create super admin
    const superAdmin = await this.createSuperAdmin();
    
    // 2. Create organization
    const organization = await this.createOrganization(superAdmin);
    
    // 3. Create org admin
    const orgAdmin = await this.createOrgAdmin(organization);
    
    // 4. Create domain
    const domain = await this.createDomain(organization, orgAdmin);
    
    // 5. Create plot
    const plot = await this.createPlot(organization, domain._id, 'Test Plot', orgAdmin);
    
    // 6. Create domain admin
    const domainAdmin = await this.createDomainAdmin(organization, domain._id);
    
    // 7. Create application user
    const appUser = await this.createApplicationUser(organization, domain._id, plot._id);
    
    // 8. Create plant type
    const plantType = await this.createPlantType(organization, orgAdmin);
    
    // 9. Create plant
    const plant = await this.createPlant(organization, domain._id, plot._id, appUser, plantType);
    
    return {
      superAdmin,
      organization,
      orgAdmin,
      domain,
      plot,
      domainAdmin,
      appUser,
      plantType,
      plant,
      domainId: domain._id,
      plotId: plot._id
    };
  }

  // Individual cleanup methods
  async cleanupPlant(plantId) {
    await Plant.deleteOne({ _id: plantId });
  }

  async cleanupOrganization(orgId) {
    await Organization.deleteOne({ _id: orgId });
  }

  async cleanupUser(userId) {
    await User.deleteOne({ _id: userId });
  }

  async cleanupDomain(domainId) {
    await Domain.deleteOne({ _id: domainId });
  }

  async cleanupPlot(plotId) {
    await Plot.deleteOne({ _id: plotId });
  }

  async cleanupPlantType(plantTypeId) {
    await PlantType.deleteOne({ _id: plantTypeId });
  }

  // Clean up all test data
  async cleanup() {
    await User.deleteMany({ _id: { $in: this.testData.users.map(u => u._id) } });
    await Organization.deleteMany({ _id: { $in: this.testData.organizations.map(o => o._id) } });
    await Domain.deleteMany({ _id: { $in: this.testData.domains.map(d => d._id) } });
    await Plot.deleteMany({ _id: { $in: this.testData.plots.map(p => p._id) } });
    await Plant.deleteMany({ _id: { $in: this.testData.plants.map(p => p._id) } });
    await PlantType.deleteMany({ _id: { $in: this.testData.plantTypes.map(pt => pt._id) } });
    
    this.testData = {
      users: [],
      organizations: [],
      domains: [],
      plots: [],
      plants: [],
      plantTypes: []
    };
  }
}

module.exports = TestDataFactory;
