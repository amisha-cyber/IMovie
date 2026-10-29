import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['booking_confirmed', 'booking_cancelled', 'hold_expired', 'reminder', 'system'],
      default: 'system'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    bookingReference: {
      type: String,
      default: null
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
