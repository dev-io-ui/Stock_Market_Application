const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'instructor', 'admin'],
    default: 'user',
  },
  profilePicture: {
    type: String,
    default: 'default.jpg',
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  interests: [{
    type: String,
    enum: ['stocks', 'crypto', 'forex', 'options', 'technical_analysis', 'fundamental_analysis'],
  }],
  subscription: {
    type: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free',
    },
    validUntil: Date,
  },
  virtualBalance: {
    type: Number,
    default: 100000, // Starting balance for virtual trading
  },
  completedCourses: [{
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
    },
    completedAt: Date,
    score: Number,
  }],
  badges: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Badge',
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  isFollowing: {
    type: Boolean,
    default: false,
  },
  experienceLevel: {
    type: String,
  },
  recentActivity: [{
    timestamp: true,
    description: String,
    type: String,
  }],
  stats: [{
    tradingScore: Number,
    winRate: Number,
    totalTrades: Number,
    followers: Number,
    isFollowing: {
      type: Boolean,
      default: false,
    },
  }],
  recentAchievements:[{
    icon: String,
    title: String,
    unlockedAt: Date,
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual populate for user's portfolios
userSchema.virtual('portfolios', {
  ref: 'Portfolio',
  foreignField: 'user',
  localField: '_id',
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
