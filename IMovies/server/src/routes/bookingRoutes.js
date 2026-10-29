import { Router } from 'express';
import {
  holdSeats,
  createPaymentOrder,
  confirmBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getTicketData
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';
import { holdLimiter, paymentLimiter } from '../middleware/rateLimiter.js';
import {
  holdSeatsValidator,
  createPaymentOrderValidator,
  confirmBookingValidator,
  cancelBookingValidator
} from '../validators/bookingValidator.js';

const router = Router();

router.use(authenticate);

router.post('/hold', holdLimiter, holdSeatsValidator, holdSeats);
router.post('/create-order', paymentLimiter, createPaymentOrderValidator, createPaymentOrder);
router.post('/confirm', paymentLimiter, confirmBookingValidator, confirmBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBookingValidator, cancelBooking);
router.get('/:id/ticket', getTicketData);

export default router;
