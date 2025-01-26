const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    achievement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true,
    },
    progress: {
      currentValue: {
        type: Number,
        default: 0,
      },
      targetValue: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },
    currentTier: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'claimed'],
      default: 'in_progress',
    },
    completedAt: Date,
    claimedAt: Date,
    streakCount: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    history: [{
      date: {
        type: Date,
        default: Date.now,
      },
      value: Number,
      event: String,
    }],
    notifications: [{
      type: {
        type: String,
        enum: ['progress', 'completion', 'claim_reminder'],
      },
      message: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      read: {
        type: Boolean,
        default: false,
      },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for time since last update
userAchievementSchema.virtual('timeSinceUpdate').get(function() {
  return Date.now() - this.lastUpdated;
});

// Virtual for days to expire (for time-limited achievements)
userAchievementSchema.virtual('daysToExpire').get(function() {
  if (!this.achievement.criteria.timeframe) return null;
  
  const timeframes = {
    daily: 1,
    weekly: 7,
    monthly: 30,
  };
  
  const days = timeframes[this.achievement.criteria.timeframe];
  if (!days) return null;
  
  const expiryDate = new Date(this.lastUpdated);
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return Math.max(0, Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)));
});

// Methods
userAchievementSchema.methods.updateProgress = async function(value, event) {
  const oldValue = this.progress.currentValue;
  this.progress.currentValue = Math.min(value, this.progress.targetValue);
  this.progress.percentage = (this.progress.currentValue / this.progress.targetValue) * 100;
  
  // Record history
  this.history.push({
    date: new Date(),
    value: this.progress.currentValue - oldValue,
    event,
  });

  // Check for completion
  if (this.progress.currentValue >= this.progress.targetValue) {
    this.status = 'completed';
    this.completedAt = new Date();
    
    // Add completion notification
    this.notifications.push({
      type: 'completion',
      message: `Congratulations! You've completed the achievement "${this.achievement.title}"!`,
    });
  }

  this.lastUpdated = new Date();
  await this.save();

  return this;
};

userAchievementSchema.methods.claim = async function() {
  if (this.status !== 'completed') {
    throw new Error('Achievement must be completed before claiming');
  }

  this.status = 'claimed';
  this.claimedAt = new Date();
  await this.save();

  return this;
};

// Compound index for efficient querying
// userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
// userAchievementSchema.index({ status: 1 });
// userAchievementSchema.index({ lastUpdated: 1 });
// userAchievementSchema.index({ 'notifications.read': 1 });

const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
module.exports = UserAchievement;
