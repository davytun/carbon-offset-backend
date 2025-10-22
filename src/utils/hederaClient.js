const { Client, PrivateKey } = require('@hashgraph/sdk');
const logger = require('./logger');

class HederaClient {
  constructor() {
    this.client = null;
  }

  initialize() {
    try {
      if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_PRIVATE_KEY) {
        throw new Error('Hedera operator credentials not found in environment variables');
      }

      this.client = Client.forTestnet();
      this.client.setOperator(
        process.env.HEDERA_OPERATOR_ID,
        PrivateKey.fromString(process.env.HEDERA_OPERATOR_PRIVATE_KEY)
      );

      logger.info('Hedera client initialized successfully');
      return this.client;
    } catch (error) {
      logger.error('Failed to initialize Hedera client:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.client) {
      return this.initialize();
    }
    return this.client;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      logger.info('Hedera client closed');
    }
  }
}

const hederaClient = new HederaClient();

// Graceful shutdown
process.on('SIGINT', async () => {
  await hederaClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await hederaClient.close();
  process.exit(0);
});

module.exports = hederaClient;