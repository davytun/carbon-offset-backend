const Offset = require('../models/Offset');
const Project = require('../models/Project');
const HederaService = require('../services/hederaService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class OffsetController {
  static async purchaseOffset(req, res, next) {
    try {
      const { userHederaAddress, projectId, quantity, totalCo2eKg, totalHbarCost } = req.body;

      // Validate project exists
      const project = await Project.findOne({ projectId, isActive: true });
      if (!project) {
        return next(new AppError('Project not found or inactive', 404));
      }

      // Check if project has enough credits
      if (project.availableCredits < totalCo2eKg) {
        return next(new AppError('Insufficient credits available in project', 400));
      }

      // Verify user has sufficient HBAR balance
      const balance = await HederaService.getAccountBalance(userHederaAddress);
      const hbarBalance = parseFloat(balance.hbar.replace(' ℏ', ''));
      
      if (hbarBalance < totalHbarCost) {
        return next(new AppError('Insufficient HBAR balance', 400));
      }

      // Transfer HBAR from user to project treasury
      const hbarTransfer = await HederaService.transferHbar(
        userHederaAddress,
        project.treasuryAccount,
        totalHbarCost
      );

      // Mint carbon offset tokens to user
      const tokenMint = await HederaService.mintTokens(
        process.env.OFFSET_TOKEN_ID,
        totalCo2eKg,
        userHederaAddress
      );

      // Update project available credits
      project.availableCredits -= totalCo2eKg;
      await project.save();

      // Store offset record
      const offset = new Offset({
        userId: req.user._id,
        projectId,
        projectName: project.name,
        quantity,
        totalCo2eKg,
        totalHbarCost,
        userHederaAddress,
        hbarTransactionId: hbarTransfer.transactionId,
        tokenMintTransactionId: tokenMint.transactionId,
        tokenId: process.env.OFFSET_TOKEN_ID,
        status: 'completed'
      });

      await offset.save();

      logger.info(`Offset purchased by user ${req.user.email}: ${totalCo2eKg} kg CO2e`);

      res.status(201).json({
        success: true,
        data: {
          offset,
          blockchain: {
            hbarTransactionId: hbarTransfer.transactionId,
            tokenMintTransactionId: tokenMint.transactionId,
            tokenId: process.env.OFFSET_TOKEN_ID
          },
          message: `Successfully purchased ${totalCo2eKg} kg CO2e offset credits`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async redeemOffset(req, res, next) {
    try {
      const { tokenAmount } = req.body;

      // Burn tokens (redeem offsets)
      const burnResult = await HederaService.burnTokens(
        process.env.OFFSET_TOKEN_ID,
        tokenAmount
      );

      // Find and update offset records
      const offsets = await Offset.find({
        userId: req.user._id,
        redemptionTransactionId: { $exists: false }
      }).sort({ createdAt: 1 });

      let remainingToRedeem = tokenAmount;
      const redeemedOffsets = [];

      for (const offset of offsets) {
        if (remainingToRedeem <= 0) break;

        const redeemAmount = Math.min(remainingToRedeem, offset.totalCo2eKg);
        
        offset.redemptionTransactionId = burnResult.transactionId;
        offset.redeemedAt = new Date();
        await offset.save();

        redeemedOffsets.push({
          offsetId: offset._id,
          amount: redeemAmount,
          projectName: offset.projectName
        });

        remainingToRedeem -= redeemAmount;
      }

      logger.info(`Offset redeemed by user ${req.user.email}: ${tokenAmount} tokens`);

      res.json({
        success: true,
        data: {
          burnTransactionId: burnResult.transactionId,
          redeemedAmount: tokenAmount,
          redeemedOffsets,
          message: `Successfully redeemed ${tokenAmount} carbon offset tokens`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBalance(req, res, next) {
    try {
      const { hederaAccountId } = req.user;
      
      if (!hederaAccountId) {
        return next(new AppError('No Hedera account associated with user', 400));
      }

      const balance = await HederaService.getAccountBalance(hederaAccountId);
      
      res.json({
        success: true,
        data: {
          accountId: hederaAccountId,
          hbarBalance: balance.hbar,
          tokenBalances: balance.tokens,
          carbonOffsetTokens: balance.tokens[process.env.OFFSET_TOKEN_ID] || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMarketplace(req, res, next) {
    try {
      const { page = 1, limit = 20, projectType, minPrice, maxPrice } = req.query;
      
      const query = { isActive: true, availableCredits: { $gt: 0 } };
      
      if (projectType) {
        query.projectType = projectType;
      }
      
      if (minPrice || maxPrice) {
        query.costPerKg = {};
        if (minPrice) query.costPerKg.$gte = parseFloat(minPrice);
        if (maxPrice) query.costPerKg.$lte = parseFloat(maxPrice);
      }

      const projects = await Project.find(query)
        .sort({ costPerKg: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Project.countDocuments(query);

      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOffsetHistory(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const offsets = await Offset.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Offset.countDocuments({ userId: req.user._id });
      const totalOffset = await Offset.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: null, total: { $sum: '$totalCo2eKg' } } }
      ]);

      res.json({
        success: true,
        data: {
          offsets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          summary: {
            totalOffset: totalOffset[0]?.total || 0,
            count: total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OffsetController;