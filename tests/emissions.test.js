const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Emission = require('../src/models/Emission');
const { generateToken } = require('../src/middleware/auth');

// Mock Hedera service
jest.mock('../src/services/hederaService', () => ({
  submitMessage: jest.fn().mockResolvedValue({
    transactionId: '0.0.123@1234567890.123456789',
    consensusTimestamp: '1234567890.123456789',
    status: 'SUCCESS'
  })
}));

describe('Emissions API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/carbon-tracker-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Emission.deleteMany({});

    const user = new User({
      email: 'test@example.com',
      passwordHash: 'password123'
    });
    await user.save();
    
    userId = user._id;
    authToken = generateToken(userId);
  });

  describe('POST /api/emissions/log', () => {
    it('should log emission successfully', async () => {
      const emissionData = {
        emissionType: 'travel',
        category: 'car_gasoline',
        amount: 100,
        unit: 'km',
        description: 'Daily commute'
      };

      const response = await request(app)
        .post('/api/emissions/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send(emissionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emission.co2eKg).toBe(21); // 100 * 0.21
      expect(response.body.data.blockchain.transactionId).toBeDefined();
    });

    it('should require authentication', async () => {
      const emissionData = {
        emissionType: 'travel',
        category: 'car_gasoline',
        amount: 100,
        unit: 'km'
      };

      await request(app)
        .post('/api/emissions/log')
        .send(emissionData)
        .expect(401);
    });
  });

  describe('GET /api/emissions/history', () => {
    beforeEach(async () => {
      const emission = new Emission({
        userId,
        emissionType: 'travel',
        category: 'car_gasoline',
        amount: 100,
        unit: 'km',
        co2eKg: 21,
        hederaTransactionId: '0.0.123@1234567890.123456789',
        consensusTimestamp: '1234567890.123456789',
        topicId: '0.0.456'
      });
      await emission.save();
    });

    it('should return emission history', async () => {
      const response = await request(app)
        .get('/api/emissions/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emissions).toHaveLength(1);
      expect(response.body.data.summary.totalEmissions).toBe(21);
    });
  });
});

module.exports = {};