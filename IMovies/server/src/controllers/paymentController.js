import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { paymentService } from '../services/paymentService.js';
import { seatReservationService } from '../services/seatReservationService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { isProduction } from '../config/environment.js';
import { BOOKING_STATUS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export const getPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate('booking');
    if (!payment) {
      return errorResponse(res, 'Payment record not found.', 404);
    }

    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied.', 403);
    }

    return successResponse(res, payment);
  } catch (error) {
    next(error);
  }
};

export const simulatePayment = async (req, res, next) => {
  try {
    if (isProduction()) {
      return errorResponse(res, 'Payment simulation is disabled in production.', 403);
    }

    const { orderId, method = 'card', shouldFail = false } = req.body;

    if (!orderId) {
      return errorResponse(res, 'orderId is required for payment simulation.', 400);
    }

    if (shouldFail) {
      return errorResponse(res, 'Simulated payment was declined by issuing bank.', 400);
    }

    const paymentId = `SIM_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return successResponse(
      res,
      {
        orderId,
        paymentId,
        method,
        status: 'success',
        verified: true,
        timestamp: new Date()
      },
      'Simulated payment processed successfully.'
    );
  } catch (error) {
    next(error);
  }
};

export const handlePaymentWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'] || req.headers['x-razorpay-signature'];
    const timestamp = req.headers['x-webhook-timestamp'] || req.headers['x-razorpay-event-time'];
    const eventId = req.headers['x-webhook-id'] || req.body?.id || req.body?.event_id;

    if (!signature) {
      return errorResponse(res, 'Missing webhook signature header', 400);
    }

    // Replay protection 1: Timestamp check (Razorpay 300-second / 5-minute replay window)
    if (timestamp) {
      const tsNum = Number(timestamp);
      const timestampMs = tsNum < 1e12 ? tsNum * 1000 : tsNum;
      const now = Date.now();
      const diffMs = Math.abs(now - timestampMs);
      if (diffMs > 300 * 1000) {
        return errorResponse(res, 'Webhook rejected: Timestamp expired (Razorpay 300s replay protection)', 400);
      }
    }

    // Replay protection 2: MongoDB unique index check on eventId
    if (eventId) {
      const existing = await WebhookEvent.findOne({ eventId });
      if (existing) {
        return successResponse(res, { processed: true, duplicate: true }, 'Webhook already processed (idempotent)');
      }
    }

    // Signature verification against rawBody
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || 'imovies_webhook_secret_key_2026';
    const rawPayload = req.rawBody ? req.rawBody : Buffer.from(JSON.stringify(req.body));
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(computedSignature);

    // Explicit buffer length check before timingSafeEqual to avoid RangeError
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return errorResponse(res, 'Invalid webhook signature', 400);
    }

    // Atomically persist processed event in MongoDB to prevent replay
    if (eventId) {
      try {
        await WebhookEvent.create({
          eventId,
          provider: 'razorpay',
          eventType: req.body?.event || 'custom_event'
        });
      } catch (dbErr) {
        if (dbErr.code === 11000) {
          return successResponse(res, { processed: true, duplicate: true }, 'Webhook already processed (idempotent)');
        }
        throw dbErr;
      }
    }

    const { event, payload } = req.body;
    logger.info(`Valid payment webhook received: ${event || 'custom_event'}`);

    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity || payload || {};
      const bookingReference = paymentEntity?.notes?.bookingReference;
      const bookingId = paymentEntity?.notes?.bookingId;

      if (bookingReference || bookingId) {
        const query = bookingId ? { _id: bookingId } : { bookingReference };
        const booking = await Booking.findOne(query);
        if (booking && booking.status === BOOKING_STATUS.PENDING) {
          try {
            await seatReservationService.confirmBookingPayment({
              bookingId: booking._id,
              paymentResult: {
                paymentId: paymentEntity.id || `PAY_${Date.now()}`,
                method: paymentEntity.method || 'webhook',
                amount: paymentEntity.amount ? paymentEntity.amount / 100 : booking.grandTotal
              },
              user: { _id: booking.user, role: 'user' }
            });
          } catch (err) {
            logger.warn(`Webhook auto-confirmation processed with note: ${err.message}`);
          }
        }
      }
    }

    return successResponse(res, { received: true, event }, 'Webhook received and verified successfully.');
  } catch (error) {
    next(error);
  }
};
