const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const jwt = require('jsonwebtoken');
const TestDataFactory = require('./testHelpers');

describe('API Endpoints', () => {
  let testData, authToken, mongoServer, testFactory;

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    await mongoose.connect(mongoUri);
    
    // Create test data factory and setup
    testFactory = new TestDataFactory();
    testData = await testFactory.createTestSetup();

    // Generate auth token for org admin
    authToken = jwt.sign({ userId: testData.orgAdmin._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    // Clean up test data
    await testFactory.cleanup();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('Authentication', () => {
    test('POST /api/auth/register - should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: 'super_admin' // Use super_admin to avoid organization requirement
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
    });

    test('POST /api/auth/login - should login user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'orgadmin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
    });

    test('GET /api/auth/me - should get current user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('orgadmin@test.com');
    });
  });

  describe('Plants API', () => {
    test('GET /api/plants - should get plants with permissions', async () => {
      const response = await request(app)
        .get('/api/plants')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('editable');
    });

    test('POST /api/plants - should create new plant', async () => {
      const newPlant = {
        name: 'New Test Plant',
        type: 'Test Plant Type',
        category: 'vegetable',
        plotId: testData.plotId,
        domainId: testData.domainId,
        organizationId: testData.organization._id,
        plantedDate: new Date(),
        planter: 'Test User'
      };

      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPlant);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Test Plant');
    });

    test('PUT /api/plants/:id - should update plant', async () => {
      const updateData = {
        name: 'Updated Test Plant',
        health: 'good'
      };

      const response = await request(app)
        .put(`/api/plants/${testData.plant._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Plant');
    });

    test('DELETE /api/plants/:id - should soft delete plant', async () => {
      const response = await request(app)
        .delete(`/api/plants/${testData.plant._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Plant Types API', () => {
    test('GET /api/plant-types - should get plant types', async () => {
      const response = await request(app)
        .get('/api/plant-types')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('POST /api/plant-types - should create new plant type', async () => {
      const newPlantType = {
        name: 'New Test Plant Type',
        category: 'fruit',
        emoji: '🍎',
        description: 'New test plant type'
      };

      const response = await request(app)
        .post('/api/plant-types')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPlantType);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Test Plant Type');
    });
  });

  describe('Permission Testing', () => {
    test('Application user should only edit plants in their plot', async () => {
      // Use the application user from test data
      const appUserToken = jwt.sign({ userId: testData.appUser._id }, process.env.JWT_SECRET || 'test-secret');

      // Try to edit plant not in user's plot (using a different plant)
      const differentPlant = await testFactory.createPlant(
        testData.organization, 
        new mongoose.Types.ObjectId(), // Different domain
        new mongoose.Types.ObjectId(), // Different plot
        testData.orgAdmin, 
        testData.plantType
      );

      const response = await request(app)
        .put(`/api/plants/${differentPlant._id}`)
        .set('Authorization', `Bearer ${appUserToken}`)
        .send({ name: 'Unauthorized Update' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/plants')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('Should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    test('Should handle non-existent resource', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/plants/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
