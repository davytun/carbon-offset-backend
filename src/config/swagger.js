const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Carbon Offset Tracker API',
    version: '1.0.0',
    description: 'API for tracking carbon emissions and purchasing tokenized carbon credits on Hedera blockchain',
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' ? 'https://your-render-app.onrender.com' : 'http://localhost:5000',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  paths: {},
  components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            hederaAccountId: { type: 'string', pattern: '^0\\.0\\.\\d+$' },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                avatar: { type: 'string' }
              }
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Emission: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            emissionType: { type: 'string', enum: ['travel', 'energy', 'food', 'other'] },
            category: { type: 'string' },
            amount: { type: 'number', minimum: 0 },
            unit: { type: 'string' },
            co2eKg: { type: 'number', minimum: 0 },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string' },
            hederaTransactionId: { type: 'string' },
            consensusTimestamp: { type: 'string' },
            topicId: { type: 'string' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            projectType: { type: 'string', enum: ['reforestation', 'renewable_energy', 'methane_capture', 'direct_air_capture', 'other'] },
            costPerKg: { type: 'number', minimum: 0 },
            availableCredits: { type: 'number', minimum: 0 },
            verificationStandard: { type: 'string', enum: ['VCS', 'CDM', 'Gold_Standard', 'CAR', 'other'] }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        }
      }
    }
  }
};

module.exports = swaggerSpec;