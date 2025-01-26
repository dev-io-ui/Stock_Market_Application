const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
    },
    category: {
      type: String,
      enum: ['learning', 'trading', 'community', 'milestone'],
      required: true,
    },
    type: {
      type: String,
      enum: ['one-time', 'tiered', 'recurring'],
      required: true,
    },
    criteria: {
      type: {
        type: String,
        enum: [
          'course_completion',
          'trade_volume',
          'profit_target',
          'login_streak',
          'forum_participation',
          'portfolio_diversity',
          'quiz_score',
        ],
        required: true,
      },
      threshold: {
        type: Number,
        required: true,
      },
      timeframe: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'all-time'],
        default: 'all-time',
      },
    },
    tiers: [{
      level: Number,
      threshold: Number,
      reward: {
        type: {
          type: String,
          enum: ['xp', 'badge', 'title', 'feature_unlock'],
        },
        value: mongoose.Schema.Types.Mixed,
      },
    }],
    reward: {
      type: {
        type: String,
        enum: ['xp', 'badge', 'title', 'feature_unlock'],
        required: true,
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    },
    icon: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'retired'],
      default: 'active',
    },
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
    }],
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for completion rate
achievementSchema.virtual('completionRate').get(function() {
  if (!this.userAchievements || this.userAchievements.length === 0) return 0;
  return (this.userAchievements.length / this.totalUsers) * 100;
});

// Indexes for efficient querying
// achievementSchema.index({ category: 1, status: 1 });
// achievementSchema.index({ type: 1 });
// achievementSchema.index({ rarity: 1 });
// achievementSchema.index({ 'criteria.type': 1 });
// achievementSchema.index({ tags: 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);
module.exports = Achievement;
