import mongoose from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../utils/constants.js';

const bookedSeatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const cancellationDetailsSchema = new mongoose.Schema(
  {
    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: '' },
    refundAmount: { type: Number, default: 0 },
    refundStatus: { type: String, default: 'none' } // 'none', 'processed', 'failed'
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show reference is required'],
      index: true
    },
    seats: [bookedSeatSchema],
    totalAmount: {
      type: Number,
      required: true
    },
    convenienceFee: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true
    },
    paymentReference: {
      type: String,
      default: ''
    },
    holdToken: {
      type: String,
      default: '',
      index: true
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },
    cancellationDetails: cancellationDetailsSchema,
    qrCode: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

bookingSchema.index({ user: 1, createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);
