import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import tradingReducer from './slices/tradingSlice';
import gamificationReducer from './slices/gamificationSlice';
import forumReducer from './slices/forumSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    trading: tradingReducer,
    gamification: gamificationReducer,
    forum: forumReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
