const {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenBurnTransaction,
  CryptoTransferTransaction,
  AccountBalanceQuery,
  TokenSupplyType,
  TokenType,
  Hbar
} = require('@hashgraph/sdk');
const hederaClient = require('../utils/hederaClient');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class HederaService {
  static async createTopic(memo = 'Carbon Emissions Topic') {
    try {
      const client = hederaClient.getClient();
      
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(memo)
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      logger.info(`Topic created with ID: ${receipt.topicId}`);
      return receipt.topicId.toString();
    } catch (error) {
      logger.error('Failed to create topic:', error);
      throw new AppError('Failed to create HCS topic', 500);
    }
  }

  static async createToken(name, symbol, decimals = 0, initialSupply = 0) {
    try {
      const client = hederaClient.getClient();
      const operatorId = client.operatorAccountId;
      const operatorKey = client.operatorPublicKey;

      const transaction = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setDecimals(decimals)
        .setInitialSupply(initialSupply)
        .setTokenType(TokenType.FungibleCommon)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(operatorId)
        .setAdminKey(operatorKey)
        .setSupplyKey(operatorKey)
        .setMaxTransactionFee(new Hbar(30));

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      logger.info(`Token created with ID: ${receipt.tokenId}`);
      return receipt.tokenId.toString();
    } catch (error) {
      logger.error('Failed to create token:', error);
      throw new AppError('Failed to create carbon offset token', 500);
    }
  }

  static async submitMessage(topicId, message) {
    try {
      const client = hederaClient.getClient();
      
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message)
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      return {
        transactionId: txResponse.transactionId.toString(),
        consensusTimestamp: receipt.consensusTimestamp ? receipt.consensusTimestamp.toString() : new Date().toISOString(),
        status: receipt.status.toString()
      };
    } catch (error) {
      logger.error('Failed to submit message to topic:', error);
      throw new AppError('Failed to log emission to blockchain', 500);
    }
  }

  static async mintTokens(tokenId, amount, recipientId) {
    try {
      const client = hederaClient.getClient();
      
      const transaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(amount)
        .setMaxTransactionFee(new Hbar(20));

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      logger.info(`Minted ${amount} tokens to ${recipientId}`);
      return {
        transactionId: txResponse.transactionId.toString(),
        status: receipt.status.toString()
      };
    } catch (error) {
      logger.error('Failed to mint tokens:', error);
      throw new AppError('Failed to mint carbon offset tokens', 500);
    }
  }

  static async burnTokens(tokenId, amount) {
    try {
      const client = hederaClient.getClient();
      
      const transaction = new TokenBurnTransaction()
        .setTokenId(tokenId)
        .setAmount(amount)
        .setMaxTransactionFee(new Hbar(20));

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      logger.info(`Burned ${amount} tokens`);
      return {
        transactionId: txResponse.transactionId.toString(),
        status: receipt.status.toString()
      };
    } catch (error) {
      logger.error('Failed to burn tokens:', error);
      throw new AppError('Failed to redeem carbon offset tokens', 500);
    }
  }

  static async transferHbar(fromAccountId, toAccountId, amount) {
    try {
      const client = hederaClient.getClient();
      
      const transaction = new CryptoTransferTransaction()
        .addHbarTransfer(fromAccountId, new Hbar(-amount))
        .addHbarTransfer(toAccountId, new Hbar(amount))
        .setMaxTransactionFee(new Hbar(2));

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);
      
      logger.info(`Transferred ${amount} HBAR from ${fromAccountId} to ${toAccountId}`);
      return {
        transactionId: txResponse.transactionId.toString(),
        status: receipt.status.toString()
      };
    } catch (error) {
      logger.error('Failed to transfer HBAR:', error);
      throw new AppError('Failed to process HBAR payment', 500);
    }
  }

  static async getAccountBalance(accountId) {
    try {
      const client = hederaClient.getClient();
      
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

      return {
        hbar: balance.hbars.toString(),
        tokens: balance.tokens ? Object.fromEntries(balance.tokens) : {}
      };
    } catch (error) {
      logger.error('Failed to get account balance:', error);
      throw new AppError('Failed to retrieve account balance', 500);
    }
  }
}

module.exports = HederaService;