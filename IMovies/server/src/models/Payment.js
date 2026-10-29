import mongoose from 'mongoose';
import { PAYMENT_PROVIDERS, PAYMENT_STATUS } from '../utils/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    provider: {
      type: String,
      enum: Object.values(PAYMENT_PROVIDERS),
      default: PAYMENT_PROVIDERS.SIMULATED
    },
    providerOrderId: {
      type: String,
      default: ''
    },
    providerPaymentId: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true
    },
    method: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'simulator'],
      default: 'simulator'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    refundId: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Enforce idempotency via unique index on providerPaymentId
paymentSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ booking: 1, status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
