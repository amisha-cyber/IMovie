import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import bookingReducer from './bookingSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer
  }
});
