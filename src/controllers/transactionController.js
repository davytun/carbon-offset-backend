const Emission = require('../models/Emission');
const Offset = require('../models/Offset');
const { AppError } = require('../middleware/errorHandler');

class TransactionController {
  static async getTransactionLogs(req, res, next) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const userId = req.user._id;

      let transactions = [];

      if (!type || type === 'emissions') {
        const emissions = await Emission.find({ userId })
          .select('emissionType category co2eKg date hederaTransactionId consensusTimestamp')
          .sort({ date: -1 })
          .limit(type === 'emissions' ? limit * 1 : Math.ceil(limit / 2))
          .skip(type === 'emissions' ? (page - 1) * limit : 0);

        transactions.push(...emissions.map(emission => ({
          id: emission._id,
          type: 'emission',
          category: `${emission.emissionType} - ${emission.category}`,
          amount: emission.co2eKg,
          unit: 'kg CO2e',
          date: emission.date,
          transactionId: emission.hederaTransactionId,
          consensusTimestamp: emission.consensusTimestamp,
          explorerUrl: `https://hashscan.io/testnet/transaction/${emission.hederaTransactionId}`
        })));
      }

      if (!type || type === 'offsets') {
        const offsets = await Offset.find({ userId })
          .select('projectName totalCo2eKg totalHbarCost createdAt hbarTransactionId tokenMintTransactionId redemptionTransactionId')
          .sort({ createdAt: -1 })
          .limit(type === 'offsets' ? limit * 1 : Math.ceil(limit / 2))
          .skip(type === 'offsets' ? (page - 1) * limit : 0);

        transactions.push(...offsets.map(offset => ({
          id: offset._id,
          type: 'offset_purchase',
          category: offset.projectName,
          amount: offset.totalCo2eKg,
          unit: 'kg CO2e',
          cost: offset.totalHbarCost,
          date: offset.createdAt,
          transactionId: offset.hbarTransactionId,
          tokenMintTransactionId: offset.tokenMintTransactionId,
          redemptionTransactionId: offset.redemptionTransactionId,
          explorerUrl: `https://hashscan.io/testnet/transaction/${offset.hbarTransactionId}`,
          tokenMintUrl: `https://hashscan.io/testnet/transaction/${offset.tokenMintTransactionId}`
        })));
      }

      // Sort all transactions by date
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Apply pagination if mixed type
      if (!type) {
        const startIndex = (page - 1) * limit;
        transactions = transactions.slice(startIndex, startIndex + limit);
      }

      const totalEmissions = await Emission.countDocuments({ userId });
      const totalOffsets = await Offset.countDocuments({ userId });
      const total = type === 'emissions' ? totalEmissions : 
                   type === 'offsets' ? totalOffsets : 
                   totalEmissions + totalOffsets;

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          summary: {
            totalEmissions,
            totalOffsets,
            totalTransactions: totalEmissions + totalOffsets
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransactionDetails(req, res, next) {
    try {
      const { transactionId } = req.params;
      const userId = req.user._id;

      // Search in emissions
      let transaction = await Emission.findOne({
        userId,
        hederaTransactionId: transactionId
      });

      if (transaction) {
        return res.json({
          success: true,
          data: {
            type: 'emission',
            transaction,
            explorerUrl: `https://hashscan.io/testnet/transaction/${transactionId}`
          }
        });
      }

      // Search in offsets
      transaction = await Offset.findOne({
        userId,
        $or: [
          { hbarTransactionId: transactionId },
          { tokenMintTransactionId: transactionId },
          { redemptionTransactionId: transactionId }
        ]
      });

      if (transaction) {
        return res.json({
          success: true,
          data: {
            type: 'offset',
            transaction,
            explorerUrl: `https://hashscan.io/testnet/transaction/${transactionId}`
          }
        });
      }

      return next(new AppError('Transaction not found', 404));
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardStats(req, res, next) {
    try {
      const userId = req.user._id;

      // Get emission stats
      const emissionStats = await Emission.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalEmissions: { $sum: '$co2eKg' },
            count: { $sum: 1 },
            avgEmission: { $avg: '$co2eKg' }
          }
        }
      ]);

      // Get offset stats
      const offsetStats = await Offset.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalOffsets: { $sum: '$totalCo2eKg' },
            totalSpent: { $sum: '$totalHbarCost' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Get recent activity
      const recentEmissions = await Emission.find({ userId })
        .sort({ date: -1 })
        .limit(5)
        .select('emissionType category co2eKg date');

      const recentOffsets = await Offset.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('projectName totalCo2eKg createdAt');

      const emission = emissionStats[0] || { totalEmissions: 0, count: 0, avgEmission: 0 };
      const offset = offsetStats[0] || { totalOffsets: 0, totalSpent: 0, count: 0 };

      res.json({
        success: true,
        data: {
          summary: {
            totalEmissions: emission.totalEmissions,
            totalOffsets: offset.totalOffsets,
            netEmissions: emission.totalEmissions - offset.totalOffsets,
            offsetPercentage: emission.totalEmissions > 0 ? 
              Math.round((offset.totalOffsets / emission.totalEmissions) * 100) : 0,
            totalSpent: offset.totalSpent,
            emissionCount: emission.count,
            offsetCount: offset.count
          },
          recentActivity: {
            emissions: recentEmissions,
            offsets: recentOffsets
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TransactionController;