import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.service';

export const fetchPortfolio = createAsyncThunk(
  'trading/fetchPortfolio',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/virtual-trading/portfolio');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch portfolio');
    }
  }
);

export const fetchWatchlist = createAsyncThunk(
  'trading/fetchWatchlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/virtual-trading/watchlist');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch watchlist');
    }
  }
);

export const fetchStockQuote = createAsyncThunk(
  'trading/fetchStockQuote',
  async (symbol, { rejectWithValue }) => {
    try {
      const response = await api.get(`/virtual-trading/quote/${symbol}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stock quote');
    }
  }
);

export const executeTrade = createAsyncThunk(
  'trading/executeTrade',
  async (tradeData, { rejectWithValue }) => {
    try {
      const response = await api.post('/virtual-trading/trade', tradeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to execute trade');
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'trading/addToWatchlist',
  async (symbol, { rejectWithValue }) => {
    try {
      const response = await api.post('/virtual-trading/watchlist', { symbol });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to watchlist');
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'trading/removeFromWatchlist',
  async (symbol, { rejectWithValue }) => {
    try {
      await api.delete(`/virtual-trading/watchlist/${symbol}`);
      return symbol;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from watchlist');
    }
  }
);

const initialState = {
  portfolio: null,
  watchlist: [],
  stockQuote: null,
  isLoading: false,
  error: null,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearStockQuote: (state) => {
      state.stockQuote = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Portfolio
      .addCase(fetchPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Watchlist
      .addCase(fetchWatchlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.watchlist = action.payload;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Stock Quote
      .addCase(fetchStockQuote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStockQuote.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stockQuote = action.payload;
      })
      .addCase(fetchStockQuote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Execute Trade
      .addCase(executeTrade.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(executeTrade.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload;
      })
      .addCase(executeTrade.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to Watchlist
      .addCase(addToWatchlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.watchlist.push(action.payload);
      })
      .addCase(addToWatchlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Remove from Watchlist
      .addCase(removeFromWatchlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.watchlist = state.watchlist.filter(
          (item) => item.symbol !== action.payload
        );
      })
      .addCase(removeFromWatchlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearStockQuote } = tradingSlice.actions;
export default tradingSlice.reducer;
