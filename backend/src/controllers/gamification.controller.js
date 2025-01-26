const Badge = require('../models/badge.model');
const User = require('../models/user.model');
const Progress = require('../models/progress.model');
const Portfolio = require('../models/portfolio.model');
const { AppError } = require('../middleware/error-handler.middleware');
const logger = require('../utils/logger');

// Check and award badges
exports.checkAndAwardBadges = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('badges');
    const progress = await Progress.find({ user: req.user._id });
    const portfolios = await Portfolio.find({ user: req.user._id });

    // Get all available badges
    const badges = await Badge.find({ status: 'active' });

    const newBadges = [];

    for (const badge of badges) {
      // Skip if user already has this badge
      if (user.badges.some(b => b._id.toString() === badge._id.toString())) {
        continue;
      }

      let isEligible = false;

      switch (badge.criteria.type) {
        case 'course_completion':
          const completedCourses = progress.filter(p => p.status === 'completed').length;
          isEligible = completedCourses >= badge.criteria.value;
          break;

        case 'trade_count':
          const totalTrades = portfolios.reduce(
            (acc, portfolio) => acc + portfolio.transactions.length,
            0
          );
          isEligible = totalTrades >= badge.criteria.value;
          break;

        case 'profit_achieved':
          const totalProfit = portfolios.reduce(
            (acc, portfolio) => acc + (portfolio.performance.totalProfitLoss || 0),
            0
          );
          isEligible = totalProfit >= badge.criteria.value;
          break;

        case 'streak_maintained':
          // Implementation for streak checking
          break;
      }

      if (isEligible) {
        user.badges.push(badge._id);
        newBadges.push(badge);

        // Award rewards if any
        if (badge.rewards.virtualCurrency) {
          user.virtualBalance += badge.rewards.virtualCurrency;
        }
      }
    }

    if (newBadges.length > 0) {
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        newBadges,
        totalBadges: user.badges.length
      }
    });
  } catch (error) {
    logger.error('Error checking badges:', error);
    next(new AppError(400, 'Failed to check badges'));
  }
};

// Get user's badges
exports.getUserBadges = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('badges')
      .select('badges');

    if (!user) {
      return next(new AppError(404, 'User not found'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        badges: user.badges
      }
    });
  } catch (error) {
    logger.error('Error fetching user badges:', error);
    next(new AppError(400, 'Failed to fetch badges'));
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { type = 'overall', timeframe = 'all' } = req.query;

    let pipeline = [];

    switch (type) {
      case 'trading':
        pipeline = [
          {
            $lookup: {
              from: 'portfolios',
              localField: '_id',
              foreignField: 'user',
              as: 'portfolios'
            }
          },
          {
            $addFields: {
              totalProfit: {
                $sum: '$portfolios.performance.totalProfitLoss'
              }
            }
          },
          {
            $sort: { totalProfit: -1 }
          }
        ];
        break;

      case 'courses':
        pipeline = [
          {
            $lookup: {
              from: 'progresses',
              localField: '_id',
              foreignField: 'user',
              as: 'progress'
            }
          },
          {
            $addFields: {
              completedCourses: {
                $size: {
                  $filter: {
                    input: '$progress',
                    as: 'p',
                    cond: { $eq: ['$$p.status', 'completed'] }
                  }
                }
              }
            }
          },
          {
            $sort: { completedCourses: -1 }
          }
        ];
        break;

      case 'badges':
        pipeline = [
          {
            $addFields: {
              badgeCount: { $size: '$badges' }
            }
          },
          {
            $sort: { badgeCount: -1 }
          }
        ];
        break;

      default: // overall
        pipeline = [
          {
            $lookup: {
              from: 'portfolios',
              localField: '_id',
              foreignField: 'user',
              as: 'portfolios'
            }
          },
          {
            $lookup: {
              from: 'progresses',
              localField: '_id',
              foreignField: 'user',
              as: 'progress'
            }
          },
          {
            $addFields: {
              score: {
                $add: [
                  { $size: '$badges' },
                  {
                    $size: {
                      $filter: {
                        input: '$progress',
                        as: 'p',
                        cond: { $eq: ['$$p.status', 'completed'] }
                      }
                    }
                  },
                  {
                    $divide: [
                      { $sum: '$portfolios.performance.totalProfitLoss' },
                      1000
                    ]
                  }
                ]
              }
            }
          },
          {
            $sort: { score: -1 }
          }
        ];
    }

    // Add timeframe filter if needed
    if (timeframe !== 'all') {
      const dateFilter = {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - getTimeframeMilliseconds(timeframe))
          }
        }
      };
      pipeline.unshift(dateFilter);
    }

    // Limit results and project needed fields
    pipeline.push(
      { $limit: 100 },
      {
        $project: {
          name: 1,
          email: 1,
          profilePicture: 1,
          score: 1,
          badgeCount: 1,
          completedCourses: 1,
          totalProfit: 1
        }
      }
    );

    const leaderboard = await User.aggregate(pipeline);

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard
      }
    });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    next(new AppError(400, 'Failed to fetch leaderboard'));
  }
};

// Helper function to get milliseconds for timeframe
function getTimeframeMilliseconds(timeframe) {
  const day = 24 * 60 * 60 * 1000;
  switch (timeframe) {
    case 'daily':
      return day;
    case 'weekly':
      return 7 * day;
    case 'monthly':
      return 30 * day;
    case 'yearly':
      return 365 * day;
    default:
      return 0;
  }
}
