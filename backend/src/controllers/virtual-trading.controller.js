const Portfolio = require('../models/portfolio.model');
const { AppError } = require('../middleware/error-handler.middleware');
const logger = require('../utils/logger');
const stockDataService = require('../services/stock-data.service');

// Create a new portfolio
exports.createPortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.create({
      ...req.body,
      user: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        portfolio
      }
    });
  } catch (error) {
    logger.error('Error creating portfolio:', error);
    next(new AppError(400, 'Failed to create portfolio'));
  }
};

// Get user's portfolios
exports.getPortfolios = async (req, res, next) => {
  try {
    const portfolios = await Portfolio.find({ user: req.user._id });

    res.status(200).json({
      status: 'success',
      results: portfolios.length,
      data: {
        portfolios
      }
    });
  } catch (error) {
    logger.error('Error fetching portfolios:', error);
    next(new AppError(400, 'Failed to fetch portfolios'));
  }
};

// Get single portfolio
exports.getPortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!portfolio) {
      return next(new AppError(404, 'Portfolio not found'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        portfolio
      }
    });
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    next(new AppError(400, 'Failed to fetch portfolio'));
  }
};

// Execute trade
exports.executeTrade = async (req, res, next) => {
  try {
    const { portfolioId, type, symbol, quantity, price } = req.body;

    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      user: req.user._id
    });

    if (!portfolio) {
      return next(new AppError(404, 'Portfolio not found'));
    }

    // Get real-time stock price
    const stockPrice = await stockDataService.getStockPrice(symbol);
    if (!stockPrice) {
      return next(new AppError(400, 'Failed to fetch stock price'));
    }

    const tradeAmount = quantity * stockPrice;

    // Validate trade
    if (type === 'buy') {
      if (portfolio.balance < tradeAmount) {
        return next(new AppError(400, 'Insufficient funds'));
      }

      // Execute buy order
      portfolio.balance -= tradeAmount;
      const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);

      if (existingHolding) {
        existingHolding.quantity += quantity;
        existingHolding.averageBuyPrice = 
          ((existingHolding.averageBuyPrice * existingHolding.quantity) + tradeAmount) / 
          (existingHolding.quantity + quantity);
      } else {
        portfolio.holdings.push({
          symbol,
          quantity,
          averageBuyPrice: stockPrice,
          currentPrice: stockPrice,
          totalValue: tradeAmount
        });
      }
    } else if (type === 'sell') {
      const holding = portfolio.holdings.find(h => h.symbol === symbol);
      
      if (!holding || holding.quantity < quantity) {
        return next(new AppError(400, 'Insufficient stocks'));
      }

      // Execute sell order
      portfolio.balance += tradeAmount;
      holding.quantity -= quantity;

      if (holding.quantity === 0) {
        portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
      }
    }

    // Record transaction
    portfolio.transactions.push({
      type,
      symbol,
      quantity,
      price: stockPrice,
      total: tradeAmount
    });

    // Update portfolio performance
    await portfolio.updatePerformance();
    await portfolio.save();

    res.status(200).json({
      status: 'success',
      data: {
        portfolio
      }
    });
  } catch (error) {
    logger.error('Error executing trade:', error);
    next(new AppError(400, 'Failed to execute trade'));
  }
};

// Get portfolio performance
exports.getPortfolioPerformance = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!portfolio) {
      return next(new AppError(404, 'Portfolio not found'));
    }

    // Update current prices and calculate performance
    for (const holding of portfolio.holdings) {
      holding.currentPrice = await stockDataService.getStockPrice(holding.symbol);
      holding.totalValue = holding.quantity * holding.currentPrice;
      holding.profitLoss = holding.totalValue - (holding.quantity * holding.averageBuyPrice);
      holding.profitLossPercentage = (holding.profitLoss / (holding.quantity * holding.averageBuyPrice)) * 100;
    }

    await portfolio.updatePerformance();
    await portfolio.save();

    res.status(200).json({
      status: 'success',
      data: {
        performance: portfolio.performance,
        holdings: portfolio.holdings
      }
    });
  } catch (error) {
    logger.error('Error fetching portfolio performance:', error);
    next(new AppError(400, 'Failed to fetch portfolio performance'));
  }
};

// Add to watchlist
exports.addToWatchlist = async (req, res, next) => {
  try {
    const { portfolioId, symbol } = req.body;

    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      user: req.user._id
    });

    if (!portfolio) {
      return next(new AppError(404, 'Portfolio not found'));
    }

    // Check if symbol exists in watchlist
    if (portfolio.watchlist.some(item => item.symbol === symbol)) {
      return next(new AppError(400, 'Symbol already in watchlist'));
    }

    portfolio.watchlist.push({ symbol });
    await portfolio.save();

    res.status(200).json({
      status: 'success',
      message: 'Added to watchlist'
    });
  } catch (error) {
    logger.error('Error adding to watchlist:', error);
    next(new AppError(400, 'Failed to add to watchlist'));
  }
};

// Remove from watchlist
exports.removeFromWatchlist = async (req, res, next) => {
  try {
    const { portfolioId, symbol } = req.params;

    const portfolio = await Portfolio.findOne({
      _id: portfolioId,
      user: req.user._id
    });

    if (!portfolio) {
      return next(new AppError(404, 'Portfolio not found'));
    }

    portfolio.watchlist = portfolio.watchlist.filter(item => item.symbol !== symbol);
    await portfolio.save();

    res.status(200).json({
      status: 'success',
      message: 'Removed from watchlist'
    });
  } catch (error) {
    logger.error('Error removing from watchlist:', error);
    next(new AppError(400, 'Failed to remove from watchlist'));
  }
};
