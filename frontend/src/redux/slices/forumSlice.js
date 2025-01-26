import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fetchTopics = createAsyncThunk(
  'forum/fetchTopics',
  async ({ category, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/forum/topics?category=${category}&page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchTopicById = createAsyncThunk(
  'forum/fetchTopicById',
  async (topicId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/forum/topics/${topicId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createTopic = createAsyncThunk(
  'forum/createTopic',
  async (topicData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/forum/topics`, topicData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createReply = createAsyncThunk(
  'forum/createReply',
  async ({ topicId, content }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/forum/topics/${topicId}/replies`,
        { content }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateTopic = createAsyncThunk(
  'forum/updateTopic',
  async ({ topicId, updates }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/forum/topics/${topicId}`,
        updates
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteTopic = createAsyncThunk(
  'forum/deleteTopic',
  async (topicId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/forum/topics/${topicId}`);
      return topicId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const forumSlice = createSlice({
  name: 'forum',
  initialState: {
    topics: [],
    currentTopic: null,
    totalTopics: 0,
    currentPage: 1,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentTopic: (state) => {
      state.currentTopic = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.topics = action.payload.topics;
        state.totalTopics = action.payload.total;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTopicById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTopicById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTopic = action.payload;
      })
      .addCase(fetchTopicById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createTopic.fulfilled, (state, action) => {
        state.topics.unshift(action.payload);
        state.totalTopics += 1;
      })
      .addCase(createReply.fulfilled, (state, action) => {
        if (state.currentTopic) {
          state.currentTopic.replies.push(action.payload);
        }
      })
      .addCase(updateTopic.fulfilled, (state, action) => {
        const index = state.topics.findIndex(
          (topic) => topic._id === action.payload._id
        );
        if (index !== -1) {
          state.topics[index] = action.payload;
        }
        if (state.currentTopic?._id === action.payload._id) {
          state.currentTopic = action.payload;
        }
      })
      .addCase(deleteTopic.fulfilled, (state, action) => {
        state.topics = state.topics.filter(
          (topic) => topic._id !== action.payload
        );
        state.totalTopics -= 1;
        if (state.currentTopic?._id === action.payload) {
          state.currentTopic = null;
        }
      });
  },
});

export const { clearCurrentTopic } = forumSlice.actions;
export default forumSlice.reducer;
