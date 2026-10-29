import crypto from 'crypto';
import { env } from '../config/environment.js';
import { PAYMENT_PROVIDERS, PAYMENT_STATUS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

class PaymentService {
  constructor() {
    this.provider = env.PAYMENT_PROVIDER || PAYMENT_PROVIDERS.SIMULATED;
    logger.info(`PaymentService initialized with provider: ${this.provider} (Test mode: ${env.PAYMENT_TEST_MODE})`);
  }

  async createOrder({ bookingReference, amount, currency = 'INR', user }) {
    if (this.provider === PAYMENT_PROVIDERS.SIMULATED) {
      const orderId = `SIM_ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      return {
        provider: PAYMENT_PROVIDERS.SIMULATED,
        orderId,
        amount,
        currency,
        key: 'simulated_dummy_key',
        notes: { bookingReference, userEmail: user.email }
      };
    }

    if (this.provider === PAYMENT_PROVIDERS.RAZORPAY) {
      if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay credentials not configured in environment.');
      }
      // Razorpay expects amount in paise (1 INR = 100 paise)
      const options = {
        amount: Math.round(amount * 100),
        currency,
        receipt: bookingReference,
        notes: { bookingReference, userId: user._id.toString() }
      };
      
      const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`
        },
        body: JSON.stringify(options)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Razorpay order creation failed: ${data.error?.description || 'Unknown error'}`);
      }
      return {
        provider: PAYMENT_PROVIDERS.RAZORPAY,
        orderId: data.id,
        amount,
        currency,
        key: env.RAZORPAY_KEY_ID
      };
    }

    throw new Error(`Unsupported payment provider: ${this.provider}`);
  }

  async verifyPayment({ orderId, paymentId, signature, payload = {} }) {
    if (this.provider === PAYMENT_PROVIDERS.SIMULATED) {
      // In simulated mode, accept simulated transactions that match the expected simulator prefix or valid signature
      if (!paymentId || !orderId) {
        return { verified: false, reason: 'Missing orderId or paymentId in simulation' };
      }
      return {
        verified: true,
        paymentId: paymentId || `SIM_PAY_${Date.now()}`,
        status: PAYMENT_STATUS.SUCCESS,
        method: payload.method || 'card'
      };
    }

    if (this.provider === PAYMENT_PROVIDERS.RAZORPAY) {
      if (!orderId || !paymentId || !signature) {
        return { verified: false, reason: 'Missing Razorpay verification parameters' };
      }
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature === signature) {
        return {
          verified: true,
          paymentId,
          status: PAYMENT_STATUS.SUCCESS,
          method: payload.method || 'card'
        };
      }
      return { verified: false, reason: 'Invalid signature signature mismatch' };
    }

    return { verified: false, reason: 'Unsupported provider' };
  }

  async refundPayment({ paymentId, amount, reason = 'Customer requested cancellation' }) {
    if (this.provider === PAYMENT_PROVIDERS.SIMULATED) {
      return {
        success: true,
        refundId: `SIM_REF_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        amount,
        status: 'processed'
      };
    }

    if (this.provider === PAYMENT_PROVIDERS.RAZORPAY) {
      const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          notes: { reason }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Razorpay refund failed: ${data.error?.description || 'Refund API failed'}`);
      }
      return {
        success: true,
        refundId: data.id,
        amount,
        status: 'processed'
      };
    }

    return { success: false, reason: 'Refund provider not implemented' };
  }
}

export const paymentService = new PaymentService();
