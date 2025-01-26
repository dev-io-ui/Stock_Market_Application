import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fetchCourses = createAsyncThunk(
  'courses/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchById',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/courses/${courseId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const enrollInCourse = createAsyncThunk(
  'courses/enroll',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/courses/${courseId}/enroll`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateProgress = createAsyncThunk(
  'courses/updateProgress',
  async ({ courseId, moduleId, progress }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/courses/${courseId}/modules/${moduleId}/progress`,
        { progress }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    courses: [],
    currentCourse: null,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchCourseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        const courseIndex = state.courses.findIndex(
          (course) => course._id === action.payload._id
        );
        if (courseIndex !== -1) {
          state.courses[courseIndex] = action.payload;
        }
        if (state.currentCourse?._id === action.payload._id) {
          state.currentCourse = action.payload;
        }
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        if (state.currentCourse) {
          const moduleIndex = state.currentCourse.modules.findIndex(
            (module) => module._id === action.payload.moduleId
          );
          if (moduleIndex !== -1) {
            state.currentCourse.modules[moduleIndex].progress =
              action.payload.progress;
          }
        }
      });
  },
});

export default courseSlice.reducer;
