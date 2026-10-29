import mongoose from 'mongoose';
import { SHOW_STATUS } from '../utils/constants.js';

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
      index: true
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Screen reference is required'],
      index: true
    },
    startTime: {
      type: Date,
      required: [true, 'Show start time is required'],
      index: true
    },
    endTime: {
      type: Date,
      required: [true, 'Show end time is required']
    },
    basePrice: {
      type: Number,
      required: [true, 'Base ticket price is required'],
      min: [50, 'Minimum ticket price is 50']
    },
    seatPricing: {
      silver: { type: Number, required: true },
      gold: { type: Number, required: true },
      platinum: { type: Number, required: true }
    },
    status: {
      type: String,
      enum: Object.values(SHOW_STATUS),
      default: SHOW_STATUS.SCHEDULED,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast show lookups by movie, theatre, and date
showSchema.index({ movie: 1, startTime: 1 });
showSchema.index({ theatre: 1, screen: 1, startTime: 1, endTime: 1 });

export const Show = mongoose.model('Show', showSchema);
