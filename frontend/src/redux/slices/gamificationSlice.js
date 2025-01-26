import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fetchAchievements = createAsyncThunk(
  'gamification/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/achievements`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'gamification/fetchLeaderboard',
  async ({ type = 'overall', timeframe = 'all' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/leaderboard?type=${type}&timeframe=${timeframe}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const claimReward = createAsyncThunk(
  'gamification/claimReward',
  async (achievementId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/achievements/${achievementId}/claim`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState: {
    achievements: [],
    leaderboard: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.achievements = action.payload;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(claimReward.fulfilled, (state, action) => {
        const achievementIndex = state.achievements.findIndex(
          (achievement) => achievement._id === action.payload._id
        );
        if (achievementIndex !== -1) {
          state.achievements[achievementIndex] = action.payload;
        }
      });
  },
});

export default gamificationSlice.reducer;
