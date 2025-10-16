const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Plant = require('../models/Plant');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

describe('Performance Tests', () => {
  let testUser, testOrg, authToken, mongoServer;
  const performanceThresholds = {
    apiResponseTime: 500, // 500ms
    databaseQueryTime: 100, // 100ms
    concurrentRequests: 50,
    memoryUsage: 100 * 1024 * 1024 // 100MB
  };

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    await mongoose.connect(mongoUri);
    
    // Create test organization
    testOrg = await Organization.create({
      name: 'Test Organization',
      description: 'Test org for performance testing'
    });

    // Create test user
    testUser = await User.create({
      username: 'perfuser',
      email: 'perf@example.com',
      password: 'password123',
      firstName: 'Performance',
      lastName: 'User',
      role: 'org_admin',
      organizationId: testOrg._id
    });

    // Generate auth token
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-secret');

    // Create test data for performance testing
    await createTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Plant.deleteMany({});
    await Organization.deleteMany({});
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  async function createTestData() {
    const plants = [];
    for (let i = 0; i < 100; i++) {
      plants.push({
        name: `Test Plant ${i}`,
        type: `Test Type ${i % 10}`,
        category: ['vegetable', 'herb', 'fruit', 'tree'][i % 4],
        plotId: new mongoose.Types.ObjectId(),
        domainId: new mongoose.Types.ObjectId(),
        organizationId: testOrg._id,
        plantedDate: new Date(),
        plantedBy: testUser._id,
        planter: 'Test User',
        health: ['excellent', 'good', 'fair', 'poor', 'deceased'][i % 5],
        growthStage: ['seed', 'seedling', 'vegetative', 'flowering', 'fruiting'][i % 5]
      });
    }
    await Plant.insertMany(plants);
  }

  describe('API Response Time Tests', () => {
    test('GET /api/plants should respond within 500ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/plants')
        .set('Authorization', `Bearer ${authToken}`);

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceThresholds.apiResponseTime);
      console.log(`GET /api/plants response time: ${responseTime}ms`);
    });

    test('GET /api/plants with pagination should respond within 500ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/plants?page=1&limit=50')
        .set('Authorization', `Bearer ${authToken}`);

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceThresholds.apiResponseTime);
      console.log(`GET /api/plants with pagination response time: ${responseTime}ms`);
    });

    test('GET /api/plants with search should respond within 500ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/plants?search=Test')
        .set('Authorization', `Bearer ${authToken}`);

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceThresholds.apiResponseTime);
      console.log(`GET /api/plants with search response time: ${responseTime}ms`);
    });

    test('GET /api/plants with filters should respond within 500ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/plants?category=vegetable&health=excellent')
        .set('Authorization', `Bearer ${authToken}`);

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceThresholds.apiResponseTime);
      console.log(`GET /api/plants with filters response time: ${responseTime}ms`);
    });

    test('POST /api/plants should respond within 500ms', async () => {
      const startTime = Date.now();
      
      const newPlant = {
        name: 'Performance Test Plant',
        type: 'Test Type',
        category: 'vegetable',
        plotId: new mongoose.Types.ObjectId(),
        domainId: new mongoose.Types.ObjectId(),
        plantedDate: new Date(),
        planter: 'Test User'
      };

      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPlant);

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(performanceThresholds.apiResponseTime);
      console.log(`POST /api/plants response time: ${responseTime}ms`);
    });
  });

  describe('Database Performance Tests', () => {
    test('Database query should complete within 100ms', async () => {
      const startTime = Date.now();
      
      const plants = await Plant.find({ organizationId: testOrg._id })
        .populate('plotId', 'name')
        .populate('domainId', 'name')
        .populate('organizationId', 'name')
        .populate('plantedBy', 'firstName lastName')
        .limit(50);

      const queryTime = Date.now() - startTime;
      
      expect(plants).toBeInstanceOf(Array);
      expect(queryTime).toBeLessThan(performanceThresholds.databaseQueryTime);
      console.log(`Database query time: ${queryTime}ms`);
    });

    test('Complex aggregation query should complete within 200ms', async () => {
      const startTime = Date.now();
      
      const aggregation = await Plant.aggregate([
        { $match: { organizationId: testOrg._id } },
        { $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          avgHealth: { $avg: { $cond: [
            { $eq: ['$health', 'excellent'] }, 1, 0
          ]}}
        }},
        { $sort: { count: -1 } }
      ]);

      const queryTime = Date.now() - startTime;
      
      expect(aggregation).toBeInstanceOf(Array);
      expect(queryTime).toBeLessThan(200); // Slightly higher threshold for aggregation
      console.log(`Aggregation query time: ${queryTime}ms`);
    });

    test('Indexed field query should be fast', async () => {
      const startTime = Date.now();
      
      const plants = await Plant.find({ 
        organizationId: testOrg._id,
        category: 'vegetable'
      }).limit(10);

      const queryTime = Date.now() - startTime;
      
      expect(plants).toBeInstanceOf(Array);
      expect(queryTime).toBeLessThan(50); // Should be very fast with proper indexing
      console.log(`Indexed query time: ${queryTime}ms`);
    });
  });

  describe('Concurrent Request Tests', () => {
    test('Should handle 10 concurrent requests', async () => {
      const requests = Array(10).fill().map(() => 
        request(app)
          .get('/api/plants')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / responses.length;
      expect(avgResponseTime).toBeLessThan(performanceThresholds.apiResponseTime);
      
      console.log(`10 concurrent requests - Total time: ${totalTime}ms, Avg: ${avgResponseTime}ms`);
    });

    test('Should handle 25 concurrent requests', async () => {
      const requests = Array(25).fill().map(() => 
        request(app)
          .get('/api/plants')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / responses.length;
      expect(avgResponseTime).toBeLessThan(performanceThresholds.apiResponseTime * 2);
      
      console.log(`25 concurrent requests - Total time: ${totalTime}ms, Avg: ${avgResponseTime}ms`);
    });
  });

  describe('Memory Usage Tests', () => {
    test('Should not exceed memory limits during heavy operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform heavy operation
      const plants = await Plant.find({ organizationId: testOrg._id })
        .populate('plotId', 'name')
        .populate('domainId', 'name')
        .populate('organizationId', 'name')
        .populate('plantedBy', 'firstName lastName');

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(performanceThresholds.memoryUsage);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Load Testing', () => {
    test('Should handle sustained load', async () => {
      const iterations = 20;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/plants')
          .set('Authorization', `Bearer ${authToken}`);

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(200);
      }

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      expect(avgResponseTime).toBeLessThan(performanceThresholds.apiResponseTime);
      expect(maxResponseTime).toBeLessThan(performanceThresholds.apiResponseTime * 2);

      console.log(`Load test results:`);
      console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  Min: ${minResponseTime}ms`);
      console.log(`  Max: ${maxResponseTime}ms`);
    });
  });

  describe('Database Connection Pool Tests', () => {
    test('Should handle multiple database operations efficiently', async () => {
      const operations = [];
      
      // Create multiple database operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          Plant.find({ organizationId: testOrg._id }).limit(10),
          Plant.countDocuments({ organizationId: testOrg._id }),
          Plant.distinct('category', { organizationId: testOrg._id })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(30); // 10 * 3 operations
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second

      console.log(`30 database operations completed in ${totalTime}ms`);
    });
  });
});
