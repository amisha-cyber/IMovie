import mongoose from 'mongoose';
import { SEAT_CATEGORY } from '../utils/constants.js';

const seatDefinitionSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true },
    number: { type: Number, required: true },
    isAisle: { type: Boolean, default: false }
  },
  { _id: false }
);

const rowDefinitionSchema = new mongoose.Schema(
  {
    rowLetter: { type: String, required: true },
    category: {
      type: String,
      enum: Object.values(SEAT_CATEGORY),
      default: SEAT_CATEGORY.SILVER
    },
    priceMultiplier: { type: Number, default: 1.0 },
    seats: [seatDefinitionSchema]
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true
    },
    screenType: {
      type: String,
      enum: ['Standard', 'IMAX', '4DX', 'Dolby Atmos', 'Gold Class'],
      default: 'Dolby Atmos'
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1
    },
    seatingLayout: {
      rows: [rowDefinitionSchema]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

screenSchema.index({ theatre: 1, name: 1 }, { unique: true });

export const Screen = mongoose.model('Screen', screenSchema);
