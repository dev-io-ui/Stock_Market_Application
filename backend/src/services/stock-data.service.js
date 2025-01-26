const axios = require('axios');
const logger = require('../utils/logger');

class StockDataService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  async getStockPrice(symbol) {
    try {
      // Check cache first
      const cachedData = this.cache.get(symbol);
      if (cachedData && Date.now() - cachedData.timestamp < this.cacheTimeout) {
        return cachedData.price;
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: this.apiKey
        }
      });

      const price = parseFloat(response.data['Global Quote']['05. price']);
      
      // Update cache
      this.cache.set(symbol, {
        price,
        timestamp: Date.now()
      });

      return price;
    } catch (error) {
      logger.error(`Error fetching stock price for ${symbol}:`, error);
      throw new Error('Failed to fetch stock price');
    }
  }

  async getStockQuote(symbol) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: this.apiKey
        }
      });

      const quote = response.data['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day']
      };
    } catch (error) {
      logger.error(`Error fetching stock quote for ${symbol}:`, error);
      throw new Error('Failed to fetch stock quote');
    }
  }

  async getHistoricalData(symbol, interval = 'daily') {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: `TIME_SERIES_${interval.toUpperCase()}`,
          symbol,
          apikey: this.apiKey
        }
      });

      const timeSeriesKey = `Time Series (${interval.charAt(0).toUpperCase() + interval.slice(1)})`;
      const timeSeries = response.data[timeSeriesKey];

      return Object.entries(timeSeries).map(([date, data]) => ({
        date,
        open: parseFloat(data['1. open']),
        high: parseFloat(data['2. high']),
        low: parseFloat(data['3. low']),
        close: parseFloat(data['4. close']),
        volume: parseInt(data['5. volume'])
      }));
    } catch (error) {
      logger.error(`Error fetching historical data for ${symbol}:`, error);
      throw new Error('Failed to fetch historical data');
    }
  }

  async searchStocks(query) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: query,
          apikey: this.apiKey
        }
      });

      return response.data.bestMatches.map(match => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        marketOpen: match['5. marketOpen'],
        marketClose: match['6. marketClose'],
        timezone: match['7. timezone'],
        currency: match['8. currency'],
        matchScore: match['9. matchScore']
      }));
    } catch (error) {
      logger.error(`Error searching stocks with query ${query}:`, error);
      throw new Error('Failed to search stocks');
    }
  }

  async getCompanyOverview(symbol) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'OVERVIEW',
          symbol,
          apikey: this.apiKey
        }
      });

      return {
        symbol: response.data.Symbol,
        name: response.data.Name,
        description: response.data.Description,
        exchange: response.data.Exchange,
        currency: response.data.Currency,
        country: response.data.Country,
        sector: response.data.Sector,
        industry: response.data.Industry,
        marketCap: parseFloat(response.data.MarketCapitalization),
        peRatio: parseFloat(response.data.PERatio),
        dividendYield: parseFloat(response.data.DividendYield),
        weekHigh52: parseFloat(response.data['52WeekHigh']),
        weekLow52: parseFloat(response.data['52WeekLow']),
        movingAverage50Day: parseFloat(response.data['50DayMovingAverage']),
        movingAverage200Day: parseFloat(response.data['200DayMovingAverage'])
      };
    } catch (error) {
      logger.error(`Error fetching company overview for ${symbol}:`, error);
      throw new Error('Failed to fetch company overview');
    }
  }

  async getMarketNews() {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          apikey: this.apiKey
        }
      });

      return response.data.feed.map(news => ({
        title: news.title,
        url: news.url,
        timePublished: news.time_published,
        summary: news.summary,
        source: news.source,
        sentiment: news.overall_sentiment,
        sentimentScore: news.overall_sentiment_score,
        tickers: news.ticker_sentiment
      }));
    } catch (error) {
      logger.error('Error fetching market news:', error);
      throw new Error('Failed to fetch market news');
    }
  }
}

module.exports = new StockDataService();
