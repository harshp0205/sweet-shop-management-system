const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Sweet = require('../models/Sweet');

describe('Inventory API', () => {
  let userToken;
  let adminToken;
  let sweetId;

  // Setup: Connect to test database before all tests
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create a regular user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Inventory User',
        email: 'inventoryuser@example.com',
        password: 'password123',
        role: 'user'
      });
    userToken = userResponse.body.token;

    // Create an admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Inventory Admin',
        email: 'inventoryadmin@example.com',
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminResponse.body.token;
  }, 30000);

  // Setup: Create a test sweet before each test
  beforeEach(async () => {
    await Sweet.deleteMany({});
    const response = await request(app)
      .post('/api/sweets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test Sweet',
        category: 'Candy',
        price: 5.99,
        quantity: 10
      });
    sweetId = response.body.sweet._id;
  }, 10000);

  // Cleanup: Close database connection after all tests
  afterAll(async () => {
    await Sweet.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  }, 10000);

  describe('POST /api/sweets/:id/purchase', () => {
    it('should successfully purchase a sweet and reduce quantity', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 3
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('sweet');
      expect(response.body.sweet.quantity).toBe(7); // 10 - 3 = 7
    });

    it('should fail to purchase without authentication', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .send({
          quantity: 2
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to purchase if quantity is zero', async () => {
      // First, buy all available stock
      await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 10
        });

      // Try to purchase when quantity is 0
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/out of stock|not available|insufficient/i);
    });

    it('should fail to purchase more than available quantity', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 15 // More than available (10)
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/insufficient|not enough/i);
    });

    it('should fail to purchase without quantity', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to purchase with invalid quantity (negative)', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: -5
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to purchase non-existent sweet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/sweets/${fakeId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 1
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/sweets/:id/restock', () => {
    it('should successfully restock a sweet as admin and increase quantity', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantity: 20
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('sweet');
      expect(response.body.sweet.quantity).toBe(30); // 10 + 20 = 30
    });

    it('should fail to restock as regular user (not admin)', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 20
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to restock without authentication', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .send({
          quantity: 20
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to restock without quantity', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to restock with invalid quantity (negative)', async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantity: -10
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to restock non-existent sweet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/sweets/${fakeId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantity: 20
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
