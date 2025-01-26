const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Badge description is required']
  },
  icon: {
    type: String,
    required: [true, 'Badge icon is required']
  },
  category: {
    type: String,
    enum: ['course', 'trading', 'achievement', 'special'],
    required: true
  },
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  criteria: {
    type: {
      type: String,
      enum: ['course_completion', 'trade_count', 'profit_achieved', 'streak_maintained'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    additionalRequirements: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  rewards: {
    virtualCurrency: Number,
    premiumDays: Number,
    specialFeatures: [String]
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'legendary'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'retired'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
// badgeSchema.index({ name: 1 });
// badgeSchema.index({ category: 1 });
// badgeSchema.index({ level: 1 });
// badgeSchema.index({ rarity: 1 });

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;
