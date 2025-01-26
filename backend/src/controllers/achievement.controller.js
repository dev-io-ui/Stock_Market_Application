const Achievement = require('../models/achievement.model');
const UserAchievement = require('../models/user-achievement.model');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');

exports.createAchievement = catchAsync(async (req, res) => {
  const achievement = await Achievement.create(req.body);
  res.status(201).json({
    status: 'success',
    data: achievement,
  });
});

exports.getAllAchievements = catchAsync(async (req, res) => {
  const filters = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete filters[field]);

  let query = Achievement.find(filters);

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  const achievements = await query;

  res.status(200).json({
    status: 'success',
    results: achievements.length,
    data: achievements,
  });
});

exports.getUserAchievements = catchAsync(async (req, res) => {
  const userAchievements = await UserAchievement.find({
    user: req.user._id,
  })
    .populate('achievement')
    .sort('-updatedAt');

  res.status(200).json({
    status: 'success',
    results: userAchievements.length,
    data: userAchievements,
  });
});

exports.checkAchievementProgress = catchAsync(async (req, res) => {
  const { achievementId } = req.params;
  
  const userAchievement = await UserAchievement.findOne({
    user: req.user._id,
    achievement: achievementId,
  }).populate('achievement');

  if (!userAchievement) {
    throw new AppError('Achievement progress not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: userAchievement,
  });
});

exports.claimAchievement = catchAsync(async (req, res) => {
  const { achievementId } = req.params;
  
  const userAchievement = await UserAchievement.findOne({
    user: req.user._id,
    achievement: achievementId,
  }).populate('achievement');

  if (!userAchievement) {
    throw new AppError('Achievement progress not found', 404);
  }

  if (userAchievement.status !== 'completed') {
    throw new AppError('Achievement must be completed before claiming', 400);
  }

  await userAchievement.claim();

  // Grant rewards
  await grantAchievementRewards(req.user._id, userAchievement);

  res.status(200).json({
    status: 'success',
    data: userAchievement,
  });
});

exports.updateAchievementProgress = catchAsync(async (req, res) => {
  const { type, value } = req.body;
  
  // Find all achievements matching the criteria type
  const achievements = await Achievement.find({
    'criteria.type': type,
    status: 'active',
  });

  const updates = [];
  
  for (const achievement of achievements) {
    let userAchievement = await UserAchievement.findOne({
      user: req.user._id,
      achievement: achievement._id,
    });

    if (!userAchievement) {
      userAchievement = await UserAchievement.create({
        user: req.user._id,
        achievement: achievement._id,
        progress: {
          currentValue: 0,
          targetValue: achievement.criteria.threshold,
        },
      });
    }

    if (userAchievement.status !== 'claimed') {
      updates.push(userAchievement.updateProgress(value, type));
    }
  }

  await Promise.all(updates);

  res.status(200).json({
    status: 'success',
    message: 'Achievement progress updated',
  });
});

exports.getAchievementLeaderboard = catchAsync(async (req, res) => {
  const { category, timeframe } = req.query;

  const pipeline = [
    {
      $match: {
        status: 'claimed',
        ...(category && { 'achievement.category': category }),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $group: {
        _id: '$user._id',
        user: { $first: '$user' },
        achievements: { $sum: 1 },
        totalXP: {
          $sum: {
            $cond: [
              { $eq: ['$achievement.reward.type', 'xp'] },
              '$achievement.reward.value',
              0,
            ],
          },
        },
      },
    },
    {
      $sort: { totalXP: -1 },
    },
    {
      $limit: 100,
    },
  ];

  const leaderboard = await UserAchievement.aggregate(pipeline);

  res.status(200).json({
    status: 'success',
    data: leaderboard,
  });
});

// Helper functions

async function grantAchievementRewards(userId, userAchievement) {
  const { reward } = userAchievement.achievement;

  switch (reward.type) {
    case 'xp':
      await grantXP(userId, reward.value);
      break;
    case 'badge':
      await grantBadge(userId, reward.value);
      break;
    case 'title':
      await grantTitle(userId, reward.value);
      break;
    case 'feature_unlock':
      await unlockFeature(userId, reward.value);
      break;
  }
}

async function grantXP(userId, amount) {
  await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: amount } }
  );
}

async function grantBadge(userId, badgeId) {
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { badges: badgeId } }
  );
}

async function grantTitle(userId, title) {
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { titles: title } }
  );
}

async function unlockFeature(userId, feature) {
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { unlockedFeatures: feature } }
  );
}
