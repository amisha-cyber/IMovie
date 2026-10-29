import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, 'Webhook event ID is required'],
      unique: true,
      index: true
    },
    provider: {
      type: String,
      required: true,
      default: 'razorpay'
    },
    eventType: {
      type: String,
      default: 'custom'
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically clean up processed events after 7 days
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
