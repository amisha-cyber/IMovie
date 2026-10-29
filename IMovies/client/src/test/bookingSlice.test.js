import { describe, it, expect } from 'vitest';
import bookingReducer, {
  toggleSeatSelection,
  clearSeatSelection,
  setHoldData,
  clearHoldData
} from '../store/bookingSlice.js';

describe('Booking Redux Slice', () => {
  const initialState = {
    currentShow: null,
    selectedSeats: [],
    holdData: null,
    holdExpiresAt: null
  };

  it('should handle initial state', () => {
    expect(bookingReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should toggle seat selection', () => {
    let state = bookingReducer(initialState, toggleSeatSelection('A1'));
    expect(state.selectedSeats).toEqual(['A1']);

    state = bookingReducer(state, toggleSeatSelection('A2'));
    expect(state.selectedSeats).toEqual(['A1', 'A2']);

    // Toggling A1 again removes it
    state = bookingReducer(state, toggleSeatSelection('A1'));
    expect(state.selectedSeats).toEqual(['A2']);
  });

  it('should enforce maximum of 10 seats per booking order', () => {
    let state = initialState;
    for (let i = 1; i <= 12; i++) {
      state = bookingReducer(state, toggleSeatSelection(`A${i}`));
    }
    expect(state.selectedSeats.length).toBe(10);
  });

  it('should clear seat selection', () => {
    let state = bookingReducer(initialState, toggleSeatSelection('A1'));
    state = bookingReducer(state, clearSeatSelection());
    expect(state.selectedSeats).toEqual([]);
  });

  it('should set and clear hold data', () => {
    const mockHold = {
      bookingId: '123',
      holdToken: 'TOKEN_XYZ',
      expiresAt: '2026-10-21T15:00:00Z',
      grandTotal: 450
    };

    let state = bookingReducer(initialState, setHoldData(mockHold));
    expect(state.holdData).toEqual(mockHold);
    expect(state.holdExpiresAt).toBe(mockHold.expiresAt);

    state = bookingReducer(state, clearHoldData());
    expect(state.holdData).toBeNull();
    expect(state.holdExpiresAt).toBeNull();
  });
});
