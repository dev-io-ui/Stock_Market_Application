const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Portfolio must belong to a user']
  },
  name: {
    type: String,
    required: [true, 'Portfolio name is required'],
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['virtual', 'real'],
    default: 'virtual'
  },
  balance: {
    type: Number,
    required: [true, 'Initial balance is required'],
    default: 100000 // Default virtual money
  },
  holdings: [{
    symbol: {
      type: String,
      required: true
    },
    companyName: String,
    quantity: {
      type: Number,
      required: true
    },
    averageBuyPrice: {
      type: Number,
      required: true
    },
    currentPrice: Number,
    totalValue: Number,
    profitLoss: Number,
    profitLossPercentage: Number
  }],
  transactions: [{
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true
    },
    symbol: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    total: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  watchlist: [{
    symbol: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  performance: {
    totalValue: Number,
    totalProfitLoss: Number,
    totalProfitLossPercentage: Number,
    dailyProfitLoss: Number,
    dailyProfitLossPercentage: Number,
    weeklyProfitLoss: Number,
    weeklyProfitLossPercentage: Number,
    monthlyProfitLoss: Number,
    monthlyProfitLossPercentage: Number
  },
  risk: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    diversificationScore: Number,
    volatilityScore: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// portfolioSchema.index({ user: 1 });
// portfolioSchema.index({ 'holdings.symbol': 1 });
// portfolioSchema.index({ status: 1 });

// Calculate total portfolio value
portfolioSchema.methods.calculateTotalValue = function() {
  let totalValue = this.balance;
  
  if (this.holdings && this.holdings.length > 0) {
    totalValue += this.holdings.reduce((acc, holding) => {
      return acc + (holding.quantity * holding.currentPrice);
    }, 0);
  }
  
  return totalValue;
};

// Update portfolio performance
portfolioSchema.methods.updatePerformance = function() {
  const totalValue = this.calculateTotalValue();
  const initialValue = 100000; // Default starting value
  
  this.performance = {
    totalValue,
    totalProfitLoss: totalValue - initialValue,
    totalProfitLossPercentage: ((totalValue - initialValue) / initialValue) * 100
  };
};

// Pre-save middleware
portfolioSchema.pre('save', async function(next) {
  if (this.isModified('holdings')) {
    this.updatePerformance();
  }
  next();
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;
