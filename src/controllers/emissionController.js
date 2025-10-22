const Emission = require('../models/Emission');
const HederaService = require('../services/hederaService');
const CO2Calculator = require('../utils/co2Calculator');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class EmissionController {
  static async logEmission(req, res, next) {
    try {
      const { emissionType, category, amount, unit, co2eKg, date, description } = req.body;
      
      // Calculate CO2e if not provided
      let calculatedCo2e = co2eKg;
      let calculationMethod = 'provided';
      
      if (!co2eKg) {
        const calculation = await CO2Calculator.calculateWithExternalAPI(
          emissionType, category, amount, unit
        );
        calculatedCo2e = calculation.co2e_kg;
        calculationMethod = calculation.source ? 'external_api' : 'internal';
      }

      // Create message for blockchain
      const message = JSON.stringify({
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        emissionType,
        category,
        amount,
        unit,
        co2eKg: calculatedCo2e,
        date: date || new Date().toISOString(),
        description,
        timestamp: new Date().toISOString()
      });

      // Submit to Hedera Consensus Service
      const hcsResult = await HederaService.submitMessage(
        process.env.HCS_TOPIC_ID,
        message
      );

      // Store in MongoDB
      const emission = new Emission({
        userId: req.user._id,
        emissionType,
        category,
        amount,
        unit,
        co2eKg: calculatedCo2e,
        date: date || new Date(),
        description,
        hederaTransactionId: hcsResult.transactionId,
        consensusTimestamp: hcsResult.consensusTimestamp,
        topicId: process.env.HCS_TOPIC_ID,
        calculationMethod
      });

      await emission.save();

      logger.info(`Emission logged for user ${req.user.email}: ${calculatedCo2e} kg CO2e`);
      
      res.status(201).json({
        success: true,
        data: {
          emission,
          blockchain: {
            transactionId: hcsResult.transactionId,
            consensusTimestamp: hcsResult.consensusTimestamp,
            topicId: process.env.HCS_TOPIC_ID
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEmissionHistory(req, res, next) {
    try {
      const { page = 1, limit = 20, startDate, endDate, emissionType } = req.query;
      
      const query = { userId: req.user._id };
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      if (emissionType) {
        query.emissionType = emissionType;
      }

      const emissions = await Emission.find(query)
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Emission.countDocuments(query);
      const totalCo2e = await Emission.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$co2eKg' } } }
      ]);

      res.json({
        success: true,
        data: {
          emissions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          summary: {
            totalEmissions: totalCo2e[0]?.total || 0,
            count: total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async calculateEmission(req, res, next) {
    try {
      const { emissionType, category, amount, unit } = req.body;
      
      const calculation = await CO2Calculator.calculateWithExternalAPI(
        emissionType, category, amount, unit
      );

      res.json({
        success: true,
        data: {
          emissionType,
          category,
          amount,
          unit,
          ...calculation
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEmissionCategories(req, res, next) {
    try {
      const categories = CO2Calculator.getSupportedCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEmissionStats(req, res, next) {
    try {
      const userId = req.user._id;
      
      const stats = await Emission.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$emissionType',
            totalCo2e: { $sum: '$co2eKg' },
            count: { $sum: 1 },
            avgCo2e: { $avg: '$co2eKg' }
          }
        },
        { $sort: { totalCo2e: -1 } }
      ]);

      const monthlyStats = await Emission.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            totalCo2e: { $sum: '$co2eKg' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);

      res.json({
        success: true,
        data: {
          byType: stats,
          monthly: monthlyStats
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EmissionController;