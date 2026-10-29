import crypto from 'crypto';
import qrcode from 'qrcode';
import { ShowSeat } from '../models/ShowSeat.js';
import { Show } from '../models/Show.js';
import { Screen } from '../models/Screen.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Notification } from '../models/Notification.js';
import { paymentService } from './paymentService.js';
import { emailService } from './emailService.js';
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SEAT_STATUS,
  SEAT_CATEGORY,
  HOLD_EXPIRY_MINUTES,
  CANCELLATION_CUTOFF_HOURS
} from '../utils/constants.js';
import { logger } from '../utils/logger.js';

class SeatReservationService {
  /**
   * Initializes ShowSeat documents for all seats configured in the screen's layout
   */
  async initializeShowSeats(showId) {
    const show = await Show.findById(showId);
    if (!show) throw new Error('Show not found');

    const screen = await Screen.findById(show.screen);
    if (!screen) throw new Error('Screen not found');

    const seatDocs = [];
    const layout = screen.seatingLayout || { rows: [] };

    for (const rowDef of layout.rows) {
      const category = rowDef.category || SEAT_CATEGORY.SILVER;
      let seatPrice = show.seatPricing?.silver || show.basePrice;
      if (category === SEAT_CATEGORY.GOLD) {
        seatPrice = show.seatPricing?.gold || Math.round(show.basePrice * 1.3);
      } else if (category === SEAT_CATEGORY.PLATINUM) {
        seatPrice = show.seatPricing?.platinum || Math.round(show.basePrice * 1.8);
      }

      for (const seat of rowDef.seats) {
        seatDocs.push({
          show: show._id,
          seatNumber: seat.seatNumber,
          row: rowDef.rowLetter,
          number: seat.number,
          category,
          price: seatPrice,
          status: SEAT_STATUS.AVAILABLE,
          heldBy: null,
          heldUntil: null,
          holdToken: null,
          booking: null
        });
      }
    }

    if (seatDocs.length > 0) {
      // Use bulkWrite with upsert to be safe and idempotent
      const bulkOps = seatDocs.map((doc) => ({
        updateOne: {
          filter: { show: doc.show, seatNumber: doc.seatNumber },
          update: { $setOnInsert: doc },
          upsert: true
        }
      }));
      await ShowSeat.bulkWrite(bulkOps);
      logger.info(`Initialized ${seatDocs.length} seats for show ${showId}`);
    }
  }

  /**
   * Cleans up expired holds lazily and returns authoritative seat status map
   */
  async getShowSeatsAuthoritative(showId, currentUserId = null) {
    const now = new Date();

    // Lazy cleanup: Release expired holds for this show
    const expiredSeats = await ShowSeat.find({
      show: showId,
      status: SEAT_STATUS.HELD,
      heldUntil: { $lt: now }
    });

    if (expiredSeats.length > 0) {
      const expiredTokens = [...new Set(expiredSeats.map((s) => s.holdToken).filter(Boolean))];
      await ShowSeat.updateMany(
        { show: showId, status: SEAT_STATUS.HELD, heldUntil: { $lt: now } },
        {
          $set: {
            status: SEAT_STATUS.AVAILABLE,
            heldBy: null,
            heldUntil: null,
            holdToken: null
          }
        }
      );

      if (expiredTokens.length > 0) {
        await Booking.updateMany(
          { holdToken: { $in: expiredTokens }, status: BOOKING_STATUS.PENDING },
          { $set: { status: BOOKING_STATUS.EXPIRED } }
        );
      }
    }

    const seats = await ShowSeat.find({ show: showId }).sort({ row: 1, number: 1 });

    return seats.map((seat) => {
      const isMyHold = currentUserId && seat.heldBy && seat.heldBy.toString() === currentUserId.toString();
      return {
        id: seat._id,
        seatNumber: seat.seatNumber,
        row: seat.row,
        number: seat.number,
        category: seat.category,
        price: seat.price,
        status: seat.status,
        isHeldByMe: Boolean(isMyHold && seat.status === SEAT_STATUS.HELD),
        heldUntil: seat.heldUntil
      };
    });
  }

  /**
   * Atomically claims a temporary hold on requested seats with all-or-nothing guarantee
   */
  async holdSeats({ showId, seatNumbers, user }) {
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      throw new Error('Please select at least one seat to reserve.');
    }
    if (seatNumbers.length > 10) {
      throw new Error('You cannot book more than 10 seats in a single order.');
    }

    const show = await Show.findById(showId).populate('movie').populate('theatre').populate('screen');
    if (!show) {
      throw new Error('Show does not exist.');
    }
    if (new Date(show.startTime) <= new Date()) {
      throw new Error('This show has already started or concluded.');
    }

    // Lazy cleanup on expired holds
    const now = new Date();
    await ShowSeat.updateMany(
      { show: showId, seatNumber: { $in: seatNumbers }, status: SEAT_STATUS.HELD, heldUntil: { $lt: now } },
      { $set: { status: SEAT_STATUS.AVAILABLE, heldBy: null, heldUntil: null, holdToken: null } }
    );

    // Fetch matching seat records
    const seatsToHold = await ShowSeat.find({
      show: showId,
      seatNumber: { $in: seatNumbers }
    });

    if (seatsToHold.length !== seatNumbers.length) {
      throw new Error('One or more selected seats do not exist in this auditorium.');
    }

    // Check if any seat is already booked or currently held by someone else
    const unavailable = seatsToHold.filter(
      (s) => s.status === SEAT_STATUS.BOOKED || (s.status === SEAT_STATUS.HELD && s.heldUntil > now)
    );
    if (unavailable.length > 0) {
      const takenSeatNumbers = unavailable.map((s) => s.seatNumber).join(', ');
      const err = new Error(`The following seat(s) are no longer available: ${takenSeatNumbers}. Please choose different seats.`);
      err.statusCode = 409;
      throw err;
    }

    // Generate cryptographic hold token & expiry
    const holdToken = `HOLD_${crypto.randomBytes(12).toString('hex')}`;
    const expiresAt = new Date(Date.now() + HOLD_EXPIRY_MINUTES * 60 * 1000);

    // ATOMIC RESERVATION:
    // Update seats matching show + seatNumbers that are AVAILABLE or EXPIRED HELD
    const updateResult = await ShowSeat.updateMany(
      {
        show: showId,
        seatNumber: { $in: seatNumbers },
        $or: [
          { status: SEAT_STATUS.AVAILABLE },
          { status: SEAT_STATUS.HELD, heldUntil: { $lt: now } }
        ]
      },
      {
        $set: {
          status: SEAT_STATUS.HELD,
          heldBy: user._id,
          heldUntil: expiresAt,
          holdToken
        }
      }
    );

    // Concurrency verification: ALL OR NOTHING
    if (updateResult.modifiedCount !== seatNumbers.length) {
      // Race condition detected! Rollback any seats modified by this operation
      await ShowSeat.updateMany(
        { show: showId, holdToken },
        {
          $set: {
            status: SEAT_STATUS.AVAILABLE,
            heldBy: null,
            heldUntil: null,
            holdToken: null
          }
        }
      );
      const conflictErr = new Error('Another user reserved one of your chosen seats just now. Please select alternative seats.');
      conflictErr.statusCode = 409;
      throw conflictErr;
    }

    // Calculate server-authoritative pricing
    const seatBreakdown = seatsToHold.map((s) => ({
      seatNumber: s.seatNumber,
      category: s.category,
      price: s.price
    }));
    const totalAmount = seatBreakdown.reduce((sum, item) => sum + item.price, 0);
    const convenienceFee = Math.round(seatBreakdown.length * 25); // Flat 25 convenience fee per ticket
    const grandTotal = totalAmount + convenienceFee;

    // Generate readable non-guessable booking reference
    const bookingReference = `IMV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create pending booking record
    const booking = await Booking.create({
      bookingReference,
      user: user._id,
      show: show._id,
      seats: seatBreakdown,
      totalAmount,
      convenienceFee,
      grandTotal,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      holdToken,
      expiresAt
    });

    return {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      holdToken,
      expiresAt,
      seats: seatBreakdown,
      totalAmount,
      convenienceFee,
      grandTotal,
      show: {
        id: show._id,
        startTime: show.startTime,
        movieTitle: show.movie?.title,
        theatreName: show.theatre?.name,
        screenName: show.screen?.name
      }
    };
  }

  /**
   * Confirms a verified payment and converts hold into booked seats atomically
   */
  async confirmBookingPayment({ bookingId, paymentResult, user }) {
    const booking = await Booking.findById(bookingId).populate({
      path: 'show',
      populate: ['movie', 'theatre', 'screen']
    });

    if (!booking) {
      const notFoundErr = new Error('Booking record not found.');
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    // 1. Idempotency check: If booking is already confirmed, return success idempotently
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      return booking;
    }

    if (booking.status === BOOKING_STATUS.CANCELLED || booking.status === BOOKING_STATUS.EXPIRED) {
      const statusErr = new Error(`Cannot confirm booking in '${booking.status}' status.`);
      statusErr.statusCode = 400;
      throw statusErr;
    }

    // 2. Strict Owner Verification
    if (booking.user.toString() !== user._id.toString() && user.role !== 'admin') {
      const ownerErr = new Error('Unauthorized booking confirmation attempt. You do not own this booking.');
      ownerErr.statusCode = 403;
      throw ownerErr;
    }

    // 3. Amount Verification in integer minor units (paise: 1 INR = 100 paise)
    if (paymentResult.amount !== undefined) {
      const expectedPaise = Math.round(Number(booking.grandTotal) * 100);
      const receivedPaise = Math.round(Number(paymentResult.amount) * 100);
      if (expectedPaise !== receivedPaise) {
        const amountErr = new Error(`Payment amount mismatch: expected ${expectedPaise} paise (₹${booking.grandTotal}), received ${receivedPaise} paise (₹${paymentResult.amount})`);
        amountErr.statusCode = 400;
        throw amountErr;
      }
    }

    // 4. Idempotency check on paymentId
    if (paymentResult.paymentId) {
      const existingPayment = await Payment.findOne({ providerPaymentId: paymentResult.paymentId });
      if (existingPayment) {
        if (existingPayment.booking.toString() === booking._id.toString()) {
          return booking; // Idempotent return
        }
        const dupErr = new Error('This payment reference has already been utilized for a different transaction.');
        dupErr.statusCode = 409;
        throw dupErr;
      }
    }

    const now = new Date();
    const isBookingExpired = booking.expiresAt && new Date(booking.expiresAt) < now;
    const seatNumbers = booking.seats.map((s) => s.seatNumber);

    // 5. Check hold expiry on seats (heldUntil and expiresAt)
    const activeHeldSeats = await ShowSeat.find({
      show: booking.show._id,
      seatNumber: { $in: seatNumbers },
      status: SEAT_STATUS.HELD,
      holdToken: booking.holdToken,
      heldUntil: { $gt: now }
    });

    // If hold has expired or seats are no longer validly held: Trigger REFUND PATH
    if (isBookingExpired || activeHeldSeats.length !== seatNumbers.length) {
      logger.warn(`Seat hold expired for booking ${booking.bookingReference}. Initiating automatic refund path.`);
      let refundResult = null;
      if (paymentResult?.paymentId) {
        try {
          refundResult = await paymentService.refundPayment({
            paymentId: paymentResult.paymentId,
            amount: booking.grandTotal,
            reason: 'Seat hold expired before payment confirmation'
          });
        } catch (refundErr) {
          logger.error(`Automatic refund failed for expired hold ${booking.bookingReference}:`, refundErr.message);
        }
      }

      booking.status = BOOKING_STATUS.EXPIRED;
      booking.paymentStatus = refundResult?.success ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.FAILED;
      booking.cancellationDetails = {
        cancelledAt: new Date(),
        cancellationReason: 'Seat hold expired before payment confirmation',
        refundAmount: booking.grandTotal,
        refundStatus: refundResult?.status || 'failed'
      };
      await booking.save();

      // Release any expired seats back to available
      await ShowSeat.updateMany(
        { show: booking.show._id, holdToken: booking.holdToken },
        {
          $set: {
            status: SEAT_STATUS.AVAILABLE,
            heldBy: null,
            heldUntil: null,
            holdToken: null
          }
        }
      );

      const expErr = new Error('Your seat hold has expired. An automatic full refund has been initiated to your original payment method.');
      expErr.statusCode = 410;
      expErr.refunded = true;
      expErr.refundResult = refundResult;
      throw expErr;
    }

    // Atomically convert seats from HELD to BOOKED
    const updateResult = await ShowSeat.updateMany(
      {
        show: booking.show._id,
        seatNumber: { $in: seatNumbers },
        status: SEAT_STATUS.HELD,
        holdToken: booking.holdToken
      },
      {
        $set: {
          status: SEAT_STATUS.BOOKED,
          booking: booking._id,
          heldUntil: null,
          holdToken: null
        }
      }
    );

    if (updateResult.modifiedCount !== seatNumbers.length) {
      // If seats could not be atomically updated, invoke refund path
      logger.warn(`Atomic seat update failed for booking ${booking.bookingReference}. Initiating automatic refund.`);
      if (paymentResult?.paymentId) {
        try {
          await paymentService.refundPayment({
            paymentId: paymentResult.paymentId,
            amount: booking.grandTotal,
            reason: 'Atomic seat claim failed during confirmation'
          });
        } catch (refundErr) {
          logger.error(`Refund error on atomic claim failure:`, refundErr.message);
        }
      }
      const failErr = new Error('The seat hold could not be converted into confirmed tickets. An automatic refund has been initiated.');
      failErr.statusCode = 409;
      throw failErr;
    }

    // Generate secure QR Code string
    const qrData = JSON.stringify({
      ref: booking.bookingReference,
      movie: booking.show.movie?.title,
      showTime: booking.show.startTime,
      seats: seatNumbers,
      total: booking.grandTotal
    });
    const qrCodeDataUrl = await qrcode.toDataURL(qrData);

    // Update booking record
    booking.status = BOOKING_STATUS.CONFIRMED;
    booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
    booking.paymentReference = paymentResult.paymentId;
    booking.qrCode = qrCodeDataUrl;
    booking.expiresAt = null;
    await booking.save();

    // Create payment entry
    await Payment.create({
      booking: booking._id,
      user: user._id,
      amount: booking.grandTotal,
      currency: 'INR',
      provider: paymentService.provider,
      providerPaymentId: paymentResult.paymentId,
      status: PAYMENT_STATUS.SUCCESS,
      method: paymentResult.method || 'simulator',
      metadata: paymentResult
    });

    // Notify user in-app
    await Notification.create({
      user: user._id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed!',
      message: `Your booking for "${booking.show.movie?.title}" at ${booking.show.theatre?.name} is confirmed. Booking Ref: ${booking.bookingReference}`,
      bookingReference: booking.bookingReference
    });

    // Send email confirmation using the centralized email service (non-blocking)
    try {
      let recipientEmail = user?.email;
      let recipientName = user?.name;
      if (!recipientEmail && booking.user) {
        const User = (await import('../models/User.js')).default;
        const dbUser = await User.findById(booking.user).select('name email');
        recipientEmail = dbUser?.email;
        recipientName = dbUser?.name;
      }
      if (recipientEmail) {
        emailService.sendBookingConfirmationEmail({
          to: recipientEmail,
          name: recipientName || 'Movie Fan',
          booking
        }).catch((err) => {
          logger.warn(`Failed to dispatch booking confirmation email: ${err.message}`);
        });
      }
    } catch (emailErr) {
      logger.warn(`Could not prepare confirmation email: ${emailErr.message}`);
    }

    return booking;
  }

  /**
   * Cancels a booking, enforces eligibility rules, releases seats, and initiates refund
   */
  async cancelBooking({ bookingId, user, reason = 'Customer requested cancellation', isAdmin = false }) {
    const booking = await Booking.findById(bookingId).populate({
      path: 'show',
      populate: ['movie', 'theatre', 'screen']
    });

    if (!booking) {
      throw new Error('Booking not found.');
    }

    // Ownership check
    if (booking.user.toString() !== user._id.toString() && !isAdmin) {
      throw new Error('You do not have permission to cancel this booking.');
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw new Error('This booking has already been cancelled.');
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new Error(`Only confirmed bookings can be cancelled. Current status: ${booking.status}`);
    }

    // Check cancellation cutoff time (e.g. at least 2 hours before showtime)
    const showStartTime = new Date(booking.show.startTime).getTime();
    const now = Date.now();
    const hoursRemaining = (showStartTime - now) / (1000 * 60 * 60);

    if (hoursRemaining < CANCELLATION_CUTOFF_HOURS && !isAdmin) {
      throw new Error(
        `Cancellations are only permitted up to ${CANCELLATION_CUTOFF_HOURS} hours before showtime. (${Math.max(
          0,
          Math.round(hoursRemaining * 60)
        )} minutes remaining).`
      );
    }

    // Release seats back to AVAILABLE
    const seatNumbers = booking.seats.map((s) => s.seatNumber);
    await ShowSeat.updateMany(
      { show: booking.show._id, seatNumber: { $in: seatNumbers }, booking: booking._id },
      {
        $set: {
          status: SEAT_STATUS.AVAILABLE,
          heldBy: null,
          heldUntil: null,
          holdToken: null,
          booking: null
        }
      }
    );

    // Process refund calculation (deduct convenience fee, refund ticket cost)
    const refundAmount = booking.totalAmount; // Refund ticket price, retain convenience fee per policy
    let refundResult = { success: true, refundId: 'REF_NA', status: 'processed' };

    if (booking.paymentReference) {
      try {
        refundResult = await paymentService.refundPayment({
          paymentId: booking.paymentReference,
          amount: refundAmount,
          reason
        });
      } catch (refundErr) {
        logger.error(`Refund failed for booking ${booking.bookingReference}:`, refundErr.message);
        refundResult = { success: false, refundId: '', status: 'failed' };
      }
    }

    // Update booking record
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.paymentStatus = refundResult.success ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.SUCCESS;
    booking.cancellationDetails = {
      cancelledAt: new Date(),
      cancellationReason: reason,
      refundAmount,
      refundStatus: refundResult.status
    };
    await booking.save();

    // Create Notification
    await Notification.create({
      user: booking.user,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingReference} has been cancelled. Refund of ₹${refundAmount} has been initiated.`,
      bookingReference: booking.bookingReference
    });

    return { booking, refundResult };
  }

  /**
   * Background cleanup for expired seat holds
   */
  async releaseExpiredHolds() {
    const now = new Date();
    const expiredSeats = await ShowSeat.find({
      status: SEAT_STATUS.HELD,
      heldUntil: { $lt: now }
    });

    if (expiredSeats.length === 0) return [];

    const expiredTokens = [...new Set(expiredSeats.map((s) => s.holdToken).filter(Boolean))];

    await ShowSeat.updateMany(
      { status: SEAT_STATUS.HELD, heldUntil: { $lt: now } },
      {
        $set: {
          status: SEAT_STATUS.AVAILABLE,
          heldBy: null,
          heldUntil: null,
          holdToken: null
        }
      }
    );

    if (expiredTokens.length > 0) {
      await Booking.updateMany(
        { holdToken: { $in: expiredTokens }, status: BOOKING_STATUS.PENDING },
        { $set: { status: BOOKING_STATUS.EXPIRED } }
      );
    }

    return expiredSeats;
  }
}

export const seatReservationService = new SeatReservationService();
