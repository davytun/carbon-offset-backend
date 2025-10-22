const User = require('../models/User');
const Emission = require('../models/Emission');
const Offset = require('../models/Offset');

class LeaderboardController {
  static async getLeaderboards(req, res, next) {
    try {
      const { type = 'offsets', limit = 10 } = req.query;

      let leaderboard = [];

      if (type === 'offsets') {
        // Top users by total carbon offsets
        leaderboard = await Offset.aggregate([
          {
            $group: {
              _id: '$userId',
              totalOffsets: { $sum: '$totalCo2eKg' },
              totalSpent: { $sum: '$totalHbarCost' },
              offsetCount: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: '$user'
          },
          {
            $project: {
              userId: '$_id',
              name: {
                $concat: [
                  { $ifNull: ['$user.profile.firstName', 'Anonymous'] },
                  ' ',
                  { $ifNull: ['$user.profile.lastName', 'User'] }
                ]
              },
              totalOffsets: 1,
              totalSpent: 1,
              offsetCount: 1
            }
          },
          { $sort: { totalOffsets: -1 } },
          { $limit: parseInt(limit) }
        ]);
      } else if (type === 'emissions') {
        // Users with highest emissions (for awareness)
        leaderboard = await Emission.aggregate([
          {
            $group: {
              _id: '$userId',
              totalEmissions: { $sum: '$co2eKg' },
              emissionCount: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: '$user'
          },
          {
            $project: {
              userId: '$_id',
              name: {
                $concat: [
                  { $ifNull: ['$user.profile.firstName', 'Anonymous'] },
                  ' ',
                  { $ifNull: ['$user.profile.lastName', 'User'] }
                ]
              },
              totalEmissions: 1,
              emissionCount: 1
            }
          },
          { $sort: { totalEmissions: -1 } },
          { $limit: parseInt(limit) }
        ]);
      } else if (type === 'net_positive') {
        // Users with best net impact (offsets - emissions)
        const userStats = await User.aggregate([
          {
            $lookup: {
              from: 'emissions',
              localField: '_id',
              foreignField: 'userId',
              as: 'emissions'
            }
          },
          {
            $lookup: {
              from: 'offsets',
              localField: '_id',
              foreignField: 'userId',
              as: 'offsets'
            }
          },
          {
            $project: {
              name: {
                $concat: [
                  { $ifNull: ['$profile.firstName', 'Anonymous'] },
                  ' ',
                  { $ifNull: ['$profile.lastName', 'User'] }
                ]
              },
              totalEmissions: { $sum: '$emissions.co2eKg' },
              totalOffsets: { $sum: '$offsets.totalCo2eKg' },
              netImpact: {
                $subtract: [
                  { $sum: '$offsets.totalCo2eKg' },
                  { $sum: '$emissions.co2eKg' }
                ]
              }
            }
          },
          {
            $match: {
              $or: [
                { totalEmissions: { $gt: 0 } },
                { totalOffsets: { $gt: 0 } }
              ]
            }
          },
          { $sort: { netImpact: -1 } },
          { $limit: parseInt(limit) }
        ]);

        leaderboard = userStats;
      }

      res.json({
        success: true,
        data: {
          type,
          leaderboard,
          count: leaderboard.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGlobalStats(req, res, next) {
    try {
      // Global platform statistics
      const totalUsers = await User.countDocuments({ isActive: true });
      
      const emissionStats = await Emission.aggregate([
        {
          $group: {
            _id: null,
            totalEmissions: { $sum: '$co2eKg' },
            totalLogs: { $sum: 1 }
          }
        }
      ]);

      const offsetStats = await Offset.aggregate([
        {
          $group: {
            _id: null,
            totalOffsets: { $sum: '$totalCo2eKg' },
            totalSpent: { $sum: '$totalHbarCost' },
            totalPurchases: { $sum: 1 }
          }
        }
      ]);

      const emission = emissionStats[0] || { totalEmissions: 0, totalLogs: 0 };
      const offset = offsetStats[0] || { totalOffsets: 0, totalSpent: 0, totalPurchases: 0 };

      res.json({
        success: true,
        data: {
          platform: {
            totalUsers,
            totalEmissions: emission.totalEmissions,
            totalOffsets: offset.totalOffsets,
            netImpact: offset.totalOffsets - emission.totalEmissions,
            totalEmissionLogs: emission.totalLogs,
            totalOffsetPurchases: offset.totalPurchases,
            totalHbarSpent: offset.totalSpent
          },
          impact: {
            offsetPercentage: emission.totalEmissions > 0 ? 
              Math.round((offset.totalOffsets / emission.totalEmissions) * 100) : 0,
            avgEmissionPerUser: totalUsers > 0 ? 
              Math.round(emission.totalEmissions / totalUsers * 100) / 100 : 0,
            avgOffsetPerUser: totalUsers > 0 ? 
              Math.round(offset.totalOffsets / totalUsers * 100) / 100 : 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LeaderboardController;