import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentShow: null,
  selectedSeats: [], // Array of seatNumber strings, e.g. ['A1', 'A2']
  holdData: null, // { bookingId, holdToken, expiresAt, seats, grandTotal }
  holdExpiresAt: null
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCurrentShow: (state, action) => {
      state.currentShow = action.payload;
      state.selectedSeats = [];
      state.holdData = null;
      state.holdExpiresAt = null;
    },
    toggleSeatSelection: (state, action) => {
      const seatNumber = action.payload;
      const index = state.selectedSeats.indexOf(seatNumber);
      if (index >= 0) {
        state.selectedSeats.splice(index, 1);
      } else {
        if (state.selectedSeats.length < 10) {
          state.selectedSeats.push(seatNumber);
        }
      }
    },
    clearSeatSelection: (state) => {
      state.selectedSeats = [];
    },
    setHoldData: (state, action) => {
      state.holdData = action.payload;
      state.holdExpiresAt = action.payload.expiresAt;
    },
    clearHoldData: (state) => {
      state.holdData = null;
      state.holdExpiresAt = null;
      state.selectedSeats = [];
    }
  }
});

export const {
  setCurrentShow,
  toggleSeatSelection,
  clearSeatSelection,
  setHoldData,
  clearHoldData
} = bookingSlice.actions;

export default bookingSlice.reducer;
