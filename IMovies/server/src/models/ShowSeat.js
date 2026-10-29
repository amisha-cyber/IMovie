import mongoose from 'mongoose';
import { SEAT_CATEGORY, SEAT_STATUS } from '../utils/constants.js';

const showSeatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show reference is required'],
      index: true
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true
    },
    row: {
      type: String,
      required: true,
      trim: true
    },
    number: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: Object.values(SEAT_CATEGORY),
      default: SEAT_CATEGORY.SILVER
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(SEAT_STATUS),
      default: SEAT_STATUS.AVAILABLE,
      index: true
    },
    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    heldUntil: {
      type: Date,
      default: null,
      index: true
    },
    holdToken: {
      type: String,
      default: null,
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Strict unique constraint: No show can have duplicate seats
showSeatSchema.index({ show: 1, seatNumber: 1 }, { unique: true });
showSeatSchema.index({ show: 1, status: 1, heldUntil: 1 });

export const ShowSeat = mongoose.model('ShowSeat', showSeatSchema);
