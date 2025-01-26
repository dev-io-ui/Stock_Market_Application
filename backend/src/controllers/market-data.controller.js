const MarketData = require('../models/market-data.model');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');
const axios = require('axios');

exports.getStockQuote = catchAsync(async (req, res) => {
  const { symbol } = req.params;
  
  // First try to get from cache (database)
  let marketData = await MarketData.findOne({ symbol: symbol.toUpperCase() });
  
  if (!marketData || marketData.needsUpdate()) {
    // Fetch fresh data from external API
    const freshData = await fetchMarketData(symbol);
    
    if (marketData) {
      // Update existing record
      marketData = await MarketData.findOneAndUpdate(
        { symbol: symbol.toUpperCase() },
        freshData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new record
      marketData = await MarketData.create(freshData);
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      symbol: marketData.symbol,
      price: marketData.data.price.current,
      change: marketData.data.change,
      volume: marketData.data.volume.current,
      lastUpdated: marketData.lastUpdated,
    },
  });
});

exports.getHistoricalData = catchAsync(async (req, res) => {
  const { symbol } = req.params;
  const { interval, from, to } = req.query;

  const marketData = await MarketData.findOne(
    { symbol: symbol.toUpperCase() },
    { historicalData: 1 }
  );

  if (!marketData) {
    throw new AppError('Symbol not found', 404);
  }

  let filteredData = marketData.historicalData;

  // Filter by date range if provided
  if (from && to) {
    filteredData = filteredData.filter(
      data => data.date >= new Date(from) && data.date <= new Date(to)
    );
  }

  // Apply interval aggregation if needed
  if (interval) {
    filteredData = aggregateHistoricalData(filteredData, interval);
  }

  res.status(200).json({
    status: 'success',
    data: filteredData,
  });
});

exports.getCompanyProfile = catchAsync(async (req, res) => {
  const { symbol } = req.params;

  const marketData = await MarketData.findOne(
    { symbol: symbol.toUpperCase() },
    { fundamentals: 1 }
  );

  if (!marketData) {
    throw new AppError('Symbol not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: marketData.fundamentals,
  });
});

exports.getMarketNews = catchAsync(async (req, res) => {
  const { symbol } = req.params;
  const { limit = 10 } = req.query;

  const marketData = await MarketData.findOne(
    { symbol: symbol.toUpperCase() },
    { news: { $slice: parseInt(limit) } }
  );

  if (!marketData) {
    throw new AppError('Symbol not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: marketData.news,
  });
});

exports.getTechnicalIndicators = catchAsync(async (req, res) => {
  const { symbol } = req.params;

  const marketData = await MarketData.findOne(
    { symbol: symbol.toUpperCase() },
    { technicalIndicators: 1 }
  );

  if (!marketData) {
    throw new AppError('Symbol not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: marketData.technicalIndicators,
  });
});

exports.searchSymbols = catchAsync(async (req, res) => {
  const { query, type } = req.query;

  const filter = {
    $or: [
      { symbol: new RegExp(query, 'i') },
      { 'fundamentals.company.name': new RegExp(query, 'i') },
    ],
  };

  if (type) {
    filter.type = type;
  }

  const results = await MarketData.find(filter)
    .select('symbol fundamentals.company.name type exchange')
    .limit(10);

  res.status(200).json({
    status: 'success',
    data: results,
  });
});

exports.getTopMovers = catchAsync(async (req, res) => {
  const { type = 'stock', limit = 10 } = req.query;

  const topGainers = await MarketData.find({ type })
    .sort({ 'data.change.percentage': -1 })
    .limit(parseInt(limit))
    .select('symbol data.price data.change fundamentals.company.name');

  const topLosers = await MarketData.find({ type })
    .sort({ 'data.change.percentage': 1 })
    .limit(parseInt(limit))
    .select('symbol data.price data.change fundamentals.company.name');

  res.status(200).json({
    status: 'success',
    data: {
      gainers: topGainers,
      losers: topLosers,
    },
  });
});

// Helper functions

async function fetchMarketData(symbol) {
  try {
    // Replace with your preferred market data API
    const response = await axios.get(
      `${process.env.MARKET_DATA_API_URL}/quote/${symbol}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MARKET_DATA_API_KEY}`,
        },
      }
    );

    return {
      symbol: symbol.toUpperCase(),
      type: 'stock', // Determine based on API response
      exchange: response.data.exchange,
      data: {
        price: {
          current: response.data.price,
          open: response.data.open,
          high: response.data.high,
          low: response.data.low,
          close: response.data.close,
          previousClose: response.data.previousClose,
        },
        volume: {
          current: response.data.volume,
          average: response.data.averageVolume,
        },
        change: {
          value: response.data.change,
          percentage: response.data.changePercent,
        },
      },
      lastUpdated: new Date(),
      updateFrequency: 'realtime',
      dataSource: {
        name: 'Primary API',
        priority: 1,
        reliability: 1,
      },
    };
  } catch (error) {
    throw new AppError('Failed to fetch market data', 500);
  }
}

function aggregateHistoricalData(data, interval) {
  // Implement data aggregation logic based on interval
  // Example: combine minute data into hourly data
  return data;
}
