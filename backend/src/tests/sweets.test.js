const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Sweet = require('../models/Sweet');

describe('Sweets API', () => {
  let userToken;
  let adminToken;
  let userId;
  let adminId;

  // Setup: Connect to test database before all tests
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create a regular user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sweet User',
        email: 'sweetuser@example.com',
        password: 'password123',
        role: 'user'
      });
    userToken = userResponse.body.token;
    userId = userResponse.body.user.id;

    // Create an admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sweet Admin',
        email: 'sweetadmin@example.com',
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminResponse.body.token;
    adminId = adminResponse.body.user.id;
  }, 30000);

  // Cleanup: Close database connection after all tests
  afterAll(async () => {
    await Sweet.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  }, 10000);

  describe('POST /api/sweets', () => {
    beforeEach(async () => {
      await Sweet.deleteMany({});
    });

    it('should successfully add a new sweet with valid authentication', async () => {
      const newSweet = {
        name: 'Chocolate Truffle',
        category: 'Chocolate',
        price: 5.99,
        quantity: 100
      };

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newSweet);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('sweet');
      expect(response.body.sweet).toHaveProperty('_id');
      expect(response.body.sweet).toHaveProperty('name', 'Chocolate Truffle');
      expect(response.body.sweet).toHaveProperty('category', 'Chocolate');
      expect(response.body.sweet).toHaveProperty('price', 5.99);
      expect(response.body.sweet).toHaveProperty('quantity', 100);
    });

    it('should fail to add sweet without authentication', async () => {
      const newSweet = {
        name: 'Gummy Bears',
        category: 'Gummy',
        price: 3.99,
        quantity: 50
      };

      const response = await request(app)
        .post('/api/sweets')
        .send(newSweet);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to add sweet without required fields', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Incomplete Sweet'
          // Missing category, price, quantity
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to add sweet with negative price', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Invalid Sweet',
          category: 'Test',
          price: -5.99,
          quantity: 10
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/sweets', () => {
    beforeEach(async () => {
      await Sweet.deleteMany({});
      // Create sample sweets
      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Milk Chocolate',
          category: 'Chocolate',
          price: 4.99,
          quantity: 100
        });

      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Gummy Worms',
          category: 'Gummy',
          price: 2.99,
          quantity: 75
        });

      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Lollipop',
          category: 'Hard Candy',
          price: 1.99,
          quantity: 150
        });
    }, 10000);

    it('should get all sweets', async () => {
      const response = await request(app).get('/api/sweets');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sweets');
      expect(Array.isArray(response.body.sweets)).toBe(true);
      expect(response.body.sweets.length).toBe(3);
    });

    it('should return empty array when no sweets exist', async () => {
      await Sweet.deleteMany({});
      const response = await request(app).get('/api/sweets');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sweets');
      expect(response.body.sweets.length).toBe(0);
    });
  });

  describe('GET /api/sweets/search', () => {
    beforeEach(async () => {
      await Sweet.deleteMany({});
      // Create sample sweets for searching
      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Dark Chocolate Bar',
          category: 'Chocolate',
          price: 6.99,
          quantity: 50
        });

      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Milk Chocolate',
          category: 'Chocolate',
          price: 4.99,
          quantity: 100
        });

      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Strawberry Gummy',
          category: 'Gummy',
          price: 3.99,
          quantity: 80
        });

      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Sour Patch Kids',
          category: 'Sour',
          price: 2.99,
          quantity: 120
        });
    }, 10000);

    it('should search sweets by name', async () => {
      const response = await request(app)
        .get('/api/sweets/search')
        .query({ name: 'Chocolate' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sweets');
      expect(response.body.sweets.length).toBe(2);
      expect(response.body.sweets[0].name).toMatch(/Chocolate/i);
    });

    it('should search sweets by category', async () => {
      const response = await request(app)
        .get('/api/sweets/search')
        .query({ category: 'Chocolate' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sweets');
      expect(response.body.sweets.length).toBe(2);
      expect(response.body.sweets[0].category).toBe('Chocolate');
    });

    it('should search sweets by price range', async () => {
      const response = await request(app)
        .get('/api/sweets/search')
        .query({ minPrice: 3, maxPrice: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sweets');
      expect(response.body.sweets.length).toBeGreaterThan(0);
      response.body.sweets.forEach(sweet => {
        expect(sweet.price).toBeGreaterThanOrEqual(3);
        expect(sweet.price).toBeLessThanOrEqual(5);
      });
    });

    it('should search sweets with multiple filters', async () => {
      const response = await request(app)
        .get('/api/sweets/search')
        .query({ category: 'Chocolate', minPrice: 5, maxPrice: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sweets');
      expect(response.body.sweets.length).toBe(1);
      expect(response.body.sweets[0].name).toBe('Dark Chocolate Bar');
    });

    it('should return empty array when no sweets match search criteria', async () => {
      const response = await request(app)
        .get('/api/sweets/search')
        .query({ name: 'NonexistentSweet' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sweets');
      expect(response.body.sweets.length).toBe(0);
    });
  });

  describe('PUT /api/sweets/:id', () => {
    let sweetId;

    beforeEach(async () => {
      await Sweet.deleteMany({});
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Original Sweet',
          category: 'Candy',
          price: 3.99,
          quantity: 50
        });
      sweetId = response.body.sweet._id;
    }, 10000);

    it('should successfully update a sweet with valid authentication', async () => {
      const response = await request(app)
        .put(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Sweet',
          price: 4.99,
          quantity: 75
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sweet');
      expect(response.body.sweet.name).toBe('Updated Sweet');
      expect(response.body.sweet.price).toBe(4.99);
      expect(response.body.sweet.quantity).toBe(75);
    });

    it('should fail to update sweet without authentication', async () => {
      const response = await request(app)
        .put(`/api/sweets/${sweetId}`)
        .send({
          name: 'Updated Sweet'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to update non-existent sweet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/sweets/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Sweet'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to update sweet with invalid price', async () => {
      const response = await request(app)
        .put(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          price: -10
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/sweets/:id', () => {
    let sweetId;

    beforeEach(async () => {
      await Sweet.deleteMany({});
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Sweet to Delete',
          category: 'Test',
          price: 2.99,
          quantity: 25
        });
      sweetId = response.body.sweet._id;
    }, 10000);

    it('should successfully delete a sweet as admin', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/deleted|removed/i);
    });

    it('should fail to delete sweet as regular user (not admin)', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to delete sweet without authentication', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${sweetId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail to delete non-existent sweet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/sweets/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
