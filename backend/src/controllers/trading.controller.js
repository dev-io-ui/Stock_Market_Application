const Portfolio = require('../models/portfolio.model');
const Transaction = require('../models/transaction.model');
const MarketData = require('../models/market-data.model');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');

exports.getPortfolio = catchAsync(async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user._id })
    .populate('holdings.stock')
    .populate('watchlist');

  if (!portfolio) {
    // Create new portfolio for user
    const newPortfolio = await Portfolio.create({
      user: req.user._id,
      cashBalance: 100000, // Starting balance
      holdings: [],
      watchlist: [],
    });

    return res.status(200).json({
      status: 'success',
      data: newPortfolio,
    });
  }

  res.status(200).json({
    status: 'success',
    data: portfolio,
  });
});

exports.executeTrade = catchAsync(async (req, res) => {
  const { symbol, type, quantity } = req.body;

  // Validate trade parameters
  if (!symbol || !type || !quantity) {
    throw new AppError('Please provide symbol, type, and quantity', 400);
  }

  // Get current stock price
  const marketData = await MarketData.findOne({ symbol });
  if (!marketData) {
    throw new AppError('Symbol not found', 404);
  }

  const currentPrice = marketData.data.price.current;
  const tradeAmount = currentPrice * quantity;

  // Get user's portfolio
  const portfolio = await Portfolio.findOne({ user: req.user._id });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  // Execute trade based on type
  if (type === 'buy') {
    // Check if user has enough cash
    if (portfolio.cashBalance < tradeAmount) {
      throw new AppError('Insufficient funds', 400);
    }

    // Update portfolio
    portfolio.cashBalance -= tradeAmount;
    
    // Update or add holding
    const existingHolding = portfolio.holdings.find(
      h => h.symbol === symbol
    );

    if (existingHolding) {
      existingHolding.quantity += quantity;
      existingHolding.averagePrice = 
        ((existingHolding.averagePrice * existingHolding.quantity) + 
        (currentPrice * quantity)) / (existingHolding.quantity + quantity);
    } else {
      portfolio.holdings.push({
        symbol,
        quantity,
        averagePrice: currentPrice,
      });
    }
  } else if (type === 'sell') {
    // Check if user has enough shares
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    if (!holding || holding.quantity < quantity) {
      throw new AppError('Insufficient shares', 400);
    }

    // Update portfolio
    portfolio.cashBalance += tradeAmount;
    
    // Update holding
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
    }
  }

  // Save portfolio changes
  await portfolio.save();

  // Record transaction
  await Transaction.create({
    user: req.user._id,
    symbol,
    type,
    quantity,
    price: currentPrice,
    amount: tradeAmount,
    timestamp: new Date(),
  });

  res.status(200).json({
    status: 'success',
    data: portfolio,
  });
});

exports.getTransactionHistory = catchAsync(async (req, res) => {
  const { startDate, endDate, type, symbol } = req.query;
  
  let query = { user: req.user._id };

  if (startDate && endDate) {
    query.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (type) query.type = type;
  if (symbol) query.symbol = symbol;

  const transactions = await Transaction.find(query)
    .sort('-timestamp')
    .limit(parseInt(req.query.limit) || 50);

  res.status(200).json({
    status: 'success',
    results: transactions.length,
    data: transactions,
  });
});

exports.getPortfolioPerformance = catchAsync(async (req, res) => {
  const { timeframe } = req.query; // daily, weekly, monthly, yearly
  const portfolio = await Portfolio.findOne({ user: req.user._id });

  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  const performanceData = await calculatePortfolioPerformance(
    portfolio,
    timeframe
  );

  res.status(200).json({
    status: 'success',
    data: performanceData,
  });
});

exports.addToWatchlist = catchAsync(async (req, res) => {
  const { symbol } = req.body;

  // Validate symbol exists
  const marketData = await MarketData.findOne({ symbol });
  if (!marketData) {
    throw new AppError('Symbol not found', 404);
  }

  const portfolio = await Portfolio.findOne({ user: req.user._id });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  // Check if symbol is already in watchlist
  if (portfolio.watchlist.includes(symbol)) {
    throw new AppError('Symbol already in watchlist', 400);
  }

  portfolio.watchlist.push(symbol);
  await portfolio.save();

  res.status(200).json({
    status: 'success',
    data: portfolio.watchlist,
  });
});

exports.removeFromWatchlist = catchAsync(async (req, res) => {
  const { symbol } = req.params;

  const portfolio = await Portfolio.findOne({ user: req.user._id });
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  portfolio.watchlist = portfolio.watchlist.filter(s => s !== symbol);
  await portfolio.save();

  res.status(200).json({
    status: 'success',
    data: portfolio.watchlist,
  });
});

exports.getWatchlist = catchAsync(async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user._id })
    .select('watchlist');

  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  // Get current data for watchlist symbols
  const watchlistData = await MarketData.find({
    symbol: { $in: portfolio.watchlist },
  }).select('symbol data.price data.change');

  res.status(200).json({
    status: 'success',
    data: watchlistData,
  });
});

// Helper functions

async function calculatePortfolioPerformance(portfolio, timeframe) {
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case 'daily':
      startDate = new Date(now.setDate(now.getDate() - 1));
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'monthly':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'yearly':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1)); // Default to monthly
  }

  const transactions = await Transaction.find({
    user: portfolio.user,
    timestamp: { $gte: startDate },
  }).sort('timestamp');

  // Calculate daily portfolio values
  const dailyValues = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= new Date()) {
    const value = await calculatePortfolioValueAtDate(
      portfolio,
      currentDate,
      transactions
    );
    
    dailyValues.push({
      date: currentDate,
      value,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dailyValues;
}

async function calculatePortfolioValueAtDate(portfolio, date, transactions) {
  // Filter transactions up to the given date
  const relevantTransactions = transactions.filter(
    t => t.timestamp <= date
  );

  // Calculate holdings at that date
  const holdings = {};
  relevantTransactions.forEach(t => {
    if (!holdings[t.symbol]) {
      holdings[t.symbol] = 0;
    }
    holdings[t.symbol] += t.type === 'buy' ? t.quantity : -t.quantity;
  });

  // Get historical prices for that date
  const symbols = Object.keys(holdings);
  const historicalPrices = await MarketData.find({
    symbol: { $in: symbols },
    'historicalData.date': { $lte: date },
  }).sort('-historicalData.date');

  // Calculate total value
  let totalValue = portfolio.cashBalance;
  for (const symbol of symbols) {
    const price = historicalPrices.find(p => p.symbol === symbol)
      ?.historicalData[0]?.close || 0;
    totalValue += holdings[symbol] * price;
  }

  return totalValue;
}
