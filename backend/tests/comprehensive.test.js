const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const jwt = require('jsonwebtoken');
const TestDataFactory = require('./testHelpers');

describe('Comprehensive API Testing Suite', () => {
  let testData, mongoServer, testFactory;
  let superAdminToken, orgAdminToken, domainAdminToken, appUserToken;

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    await mongoose.connect(mongoUri);
    
    // Create test data factory and setup
    testFactory = new TestDataFactory();
    testData = await testFactory.createTestSetup();

    // Generate auth tokens for different roles
    superAdminToken = jwt.sign({ userId: testData.superAdmin._id }, process.env.JWT_SECRET || 'test-secret');
    orgAdminToken = jwt.sign({ userId: testData.orgAdmin._id }, process.env.JWT_SECRET || 'test-secret');
    domainAdminToken = jwt.sign({ userId: testData.domainAdmin._id }, process.env.JWT_SECRET || 'test-secret');
    appUserToken = jwt.sign({ userId: testData.appUser._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    // Clean up test data
    await testFactory.cleanup();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
      test('should register new super admin user', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'newsuperadmin',
            email: 'newsuperadmin@example.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'SuperAdmin',
            role: 'super_admin'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.role).toBe('super_admin');
      });

      test('should register new org admin user', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'neworgadmin',
            email: 'neworgadmin@example.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'OrgAdmin',
            role: 'org_admin',
            organizationId: testData.organization._id
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.user.role).toBe('org_admin');
      });

      test('should fail with invalid email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'invaliduser',
            email: 'invalid-email',
            password: 'password123',
            firstName: 'Invalid',
            lastName: 'User',
            role: 'super_admin'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      test('should fail with weak password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'weakuser',
            email: 'weakuser@example.com',
            password: '123',
            firstName: 'Weak',
            lastName: 'User',
            role: 'super_admin'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/auth/login', () => {
      test('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'orgadmin@test.com',
            password: 'password123'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe('orgadmin@test.com');
      });

      test('should fail with invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'orgadmin@test.com',
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      test('should fail with non-existent user', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password123'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/auth/me', () => {
      test('should get current user with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${orgAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe('orgadmin@test.com');
      });

      test('should fail with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
      });

      test('should fail without token', async () => {
        const response = await request(app)
          .get('/api/auth/me');

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Organizations API', () => {
    describe('GET /api/organizations', () => {
      test('should get organizations for super admin', async () => {
        const response = await request(app)
          .get('/api/organizations')
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('should fail for non-super admin users', async () => {
        const response = await request(app)
          .get('/api/organizations')
          .set('Authorization', `Bearer ${orgAdminToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/organizations', () => {
      test('should create organization for super admin', async () => {
        const newOrg = {
          name: 'Test Organization 2',
          description: 'Another test organization',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'India'
          },
          contactInfo: {
            email: 'test2@example.com',
            phone: '1234567890'
          }
        };

        const response = await request(app)
          .post('/api/organizations')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(newOrg);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Organization 2');
      });

      test('should fail for non-super admin users', async () => {
        const response = await request(app)
          .post('/api/organizations')
          .set('Authorization', `Bearer ${orgAdminToken}`)
          .send({ name: 'Test Org' });

        expect(response.status).toBe(403);
      });
    });

    describe('PUT /api/organizations/:id', () => {
      test('should update organization for super admin', async () => {
        const updateData = {
          name: 'Updated Organization',
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/api/organizations/${testData.organization._id}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Organization');
      });
    });

    describe('DELETE /api/organizations/:id', () => {
      test('should delete organization for super admin', async () => {
        const response = await request(app)
          .delete(`/api/organizations/${testData.organization._id}`)
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Domains API', () => {
    describe('GET /api/domains', () => {
      test('should get domains for super admin', async () => {
        const response = await request(app)
          .get('/api/domains')
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('should get domains for org admin', async () => {
        const response = await request(app)
          .get('/api/domains')
          .set('Authorization', `Bearer ${orgAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('should fail for application user', async () => {
        const response = await request(app)
          .get('/api/domains')
          .set('Authorization', `Bearer ${appUserToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/domains', () => {
      test('should create domain for super admin', async () => {
        const newDomain = {
          name: 'Test Domain 2',
          description: 'Another test domain',
          location: 'Test Location',
          size: 1000,
          soilType: 'loam',
          climate: 'tropical',
          organizationId: testData.organization._id
        };

        const response = await request(app)
          .post('/api/domains')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(newDomain);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Domain 2');
      });

      test('should create domain for org admin', async () => {
        const newDomain = {
          name: 'Test Domain 3',
          description: 'Org admin domain',
          location: 'Test Location',
          size: 500,
          soilType: 'sandy',
          climate: 'subtropical',
          organizationId: testData.organization._id
        };

        const response = await request(app)
          .post('/api/domains')
          .set('Authorization', `Bearer ${orgAdminToken}`)
          .send(newDomain);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Plots API', () => {
    describe('GET /api/plots', () => {
      test('should get plots for super admin', async () => {
        const response = await request(app)
          .get('/api/plots')
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('should get plots for domain admin', async () => {
        const response = await request(app)
          .get('/api/plots')
          .set('Authorization', `Bearer ${domainAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('should get plots for application user', async () => {
        const response = await request(app)
          .get('/api/plots')
          .set('Authorization', `Bearer ${appUserToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('POST /api/plots', () => {
      test('should create plot for super admin', async () => {
        const newPlot = {
          name: 'Test Plot 2',
          description: 'Another test plot',
          size: 100,
          location: 'Test Location',
          soilType: 'loam',
          domainId: testData.domainId,
          organizationId: testData.organization._id
        };

        const response = await request(app)
          .post('/api/plots')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(newPlot);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Plot 2');
      });

      test('should create plot for domain admin', async () => {
        const newPlot = {
          name: 'Test Plot 3',
          description: 'Domain admin plot',
          size: 50,
          location: 'Test Location',
          soilType: 'sandy',
          domainId: testData.domainId,
          organizationId: testData.organization._id
        };

        const response = await request(app)
          .post('/api/plots')
          .set('Authorization', `Bearer ${domainAdminToken}`)
          .send(newPlot);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Users API', () => {
    describe('GET /api/users', () => {
      test('should get users for super admin', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('should get users for org admin', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${orgAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('should get users for domain admin', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${domainAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('should fail for application user', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${appUserToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/users', () => {
      test('should create user for super admin', async () => {
        const newUser = {
          username: 'newuser1',
          email: 'newuser1@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User1',
          role: 'application_user',
          organizationId: testData.organization._id,
          domainId: testData.domainId,
          plotId: testData.plotId
        };

        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(newUser);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe('newuser1@example.com');
      });

      test('should create user for org admin', async () => {
        const newUser = {
          username: 'newuser2',
          email: 'newuser2@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User2',
          role: 'application_user',
          organizationId: testData.organization._id,
          domainId: testData.domainId,
          plotId: testData.plotId
        };

        const response = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${orgAdminToken}`)
          .send(newUser);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Plants API', () => {
    describe('GET /api/plants', () => {
      test('should get plants for super admin', async () => {
        const response = await request(app)
          .get('/api/plants')
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('should get plants for application user', async () => {
        const response = await request(app)
          .get('/api/plants')
          .set('Authorization', `Bearer ${appUserToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('POST /api/plants', () => {
      test('should create plant for super admin', async () => {
        const newPlant = {
          name: 'Test Plant 2',
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
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(newPlant);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Plant 2');
      });

      test('should create plant for application user', async () => {
        console.log('Test data:', {
          plotId: testData.plotId,
          domainId: testData.domainId,
          organizationId: testData.organization._id,
          appUser: testData.appUser
        });
        
        const newPlant = {
          name: 'Test Plant 3',
          type: 'Test Plant Type',
          category: 'fruit',
          plotId: testData.appUser.plotId, // Use the application user's plotId
          domainId: testData.domainId,
          organizationId: testData.organization._id,
          plantedDate: new Date(),
          planter: 'Test User'
        };

        const response = await request(app)
          .post('/api/plants')
          .set('Authorization', `Bearer ${appUserToken}`)
          .send(newPlant);

        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/plants/:id', () => {
      test('should update plant for super admin', async () => {
        const updateData = {
          name: 'Updated Test Plant',
          health: 'good'
        };

        const response = await request(app)
          .put(`/api/plants/${testData.plant._id}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Test Plant');
      });

      test('should fail for application user updating plant not in their plot', async () => {
        // Create a plant in a different plot
        const differentPlot = await testFactory.createPlot(
          testData.organization,
          testData.domainId,
          'Different Plot',
          testData.orgAdmin
        );

        const differentPlant = await testFactory.createPlant(
          testData.organization,
          testData.domainId,
          differentPlot._id,
          testData.orgAdmin,
          testData.plantType
        );

        const response = await request(app)
          .put(`/api/plants/${differentPlant._id}`)
          .set('Authorization', `Bearer ${appUserToken}`)
          .send({ name: 'Unauthorized Update' });

        expect(response.status).toBe(403);
      });
    });
  });

  describe('Plant Types API', () => {
    describe('GET /api/plant-types', () => {
      test('should get plant types for all users', async () => {
        const response = await request(app)
          .get('/api/plant-types')
          .set('Authorization', `Bearer ${appUserToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('POST /api/plant-types', () => {
      test('should create plant type for super admin', async () => {
        const newPlantType = {
          name: 'Test Plant Type 2',
          category: 'fruit',
          emoji: '🍎',
          description: 'Another test plant type'
        };

        const response = await request(app)
          .post('/api/plant-types')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(newPlantType);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Plant Type 2');
      });
    });
  });

  describe('Plant Varieties API', () => {
    describe('GET /api/plant-varieties', () => {
      test('should get plant varieties for all users', async () => {
        const response = await request(app)
          .get('/api/plant-varieties')
          .set('Authorization', `Bearer ${appUserToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('POST /api/plant-varieties', () => {
      test('should create plant variety for super admin', async () => {
        const newPlantVariety = {
          name: 'Test Variety 2',
          plantTypeId: testData.plantType._id,
          description: 'Another test variety'
        };

        const response = await request(app)
          .post('/api/plant-varieties')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(newPlantVariety);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Variety 2');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(404);
    });

    test('should handle 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    test('should handle 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testData.superAdmin._id, exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET || 'test-secret'
      );

      const response = await request(app)
        .get('/api/plants')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    test('should handle 403 for insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${appUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Role-based Access Control', () => {
    test('super admin should have access to all resources', async () => {
      const endpoints = [
        '/api/organizations',
        '/api/domains',
        '/api/plots',
        '/api/users',
        '/api/plants',
        '/api/plant-types',
        '/api/plant-varieties'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(response.status).toBe(200);
      }
    });

    test('org admin should have limited access', async () => {
      // Should have access
      const accessibleEndpoints = [
        '/api/domains',
        '/api/plots',
        '/api/users',
        '/api/plants',
        '/api/plant-types',
        '/api/plant-varieties'
      ];

      for (const endpoint of accessibleEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${orgAdminToken}`);

        expect(response.status).toBe(200);
      }

      // Should not have access
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(response.status).toBe(403);
    });

    test('application user should have minimal access', async () => {
      // Should have access
      const accessibleEndpoints = [
        '/api/plots',
        '/api/plants',
        '/api/plant-types',
        '/api/plant-varieties'
      ];

      for (const endpoint of accessibleEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${appUserToken}`);

        expect(response.status).toBe(200);
      }

      // Should not have access
      const restrictedEndpoints = [
        '/api/organizations',
        '/api/domains',
        '/api/users'
      ];

      for (const endpoint of restrictedEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${appUserToken}`);

        expect(response.status).toBe(403);
      }
    });
  });
});
