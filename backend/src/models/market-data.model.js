const mongoose = require('mongoose');

const marketDataSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['stock', 'etf', 'crypto', 'forex', 'commodity'],
      required: true,
    },
    exchange: {
      type: String,
      required: true,
    },
    data: {
      price: {
        current: Number,
        open: Number,
        high: Number,
        low: Number,
        close: Number,
        previousClose: Number,
      },
      volume: {
        current: Number,
        average: Number,
      },
      change: {
        value: Number,
        percentage: Number,
      },
      marketCap: Number,
      peRatio: Number,
      dividendYield: Number,
      beta: Number,
      fiftyTwoWeek: {
        high: Number,
        low: Number,
      },
      movingAverages: {
        fiftyDay: Number,
        twoHundredDay: Number,
      },
    },
    historicalData: [{
      date: Date,
      open: Number,
      high: Number,
      low: Number,
      close: Number,
      volume: Number,
      adjustedClose: Number,
    }],
    technicalIndicators: {
      rsi: Number,
      macd: {
        value: Number,
        signal: Number,
        histogram: Number,
      },
      bollingerBands: {
        upper: Number,
        middle: Number,
        lower: Number,
      },
    },
    fundamentals: {
      company: {
        name: String,
        description: String,
        sector: String,
        industry: String,
        country: String,
        employees: Number,
        ceo: String,
        website: String,
      },
      financials: {
        revenue: Number,
        netIncome: Number,
        eps: Number,
        debtToEquity: Number,
        currentRatio: Number,
        quickRatio: Number,
        returnOnEquity: Number,
        returnOnAssets: Number,
      },
    },
    news: [{
      title: String,
      summary: String,
      source: String,
      url: String,
      publishedAt: Date,
      sentiment: {
        score: Number,
        label: {
          type: String,
          enum: ['positive', 'negative', 'neutral'],
        },
      },
    }],
    lastUpdated: {
      type: Date,
      required: true,
    },
    updateFrequency: {
      type: String,
      enum: ['realtime', '1min', '5min', '15min', '30min', '1hour', '1day'],
      required: true,
    },
    dataSource: {
      name: String,
      priority: Number,
      reliability: Number,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'delisted'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for data freshness
marketDataSchema.virtual('isFresh').get(function() {
  const now = new Date();
  const updateThresholds = {
    realtime: 1000 * 10, // 10 seconds
    '1min': 1000 * 60, // 1 minute
    '5min': 1000 * 60 * 5,
    '15min': 1000 * 60 * 15,
    '30min': 1000 * 60 * 30,
    '1hour': 1000 * 60 * 60,
    '1day': 1000 * 60 * 60 * 24,
  };
  
  const threshold = updateThresholds[this.updateFrequency];
  return (now - this.lastUpdated) <= threshold;
});

// Method to check if data needs update
marketDataSchema.methods.needsUpdate = function() {
  return !this.isFresh;
};

// Indexes for efficient querying
// marketDataSchema.index({ symbol: 1 }, { unique: true });
// marketDataSchema.index({ type: 1 });
// marketDataSchema.index({ exchange: 1 });
// marketDataSchema.index({ lastUpdated: 1 });
// marketDataSchema.index({ status: 1 });
// marketDataSchema.index({ 'fundamentals.company.sector': 1 });
// marketDataSchema.index({ 'fundamentals.company.industry': 1 });

const MarketData = mongoose.model('MarketData', marketDataSchema);
module.exports = MarketData;
