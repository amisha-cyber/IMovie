import { Booking } from '../models/Booking.js';
import { seatReservationService } from '../services/seatReservationService.js';
import { paymentService } from '../services/paymentService.js';
import { broadcastSeatHold, broadcastSeatRelease, broadcastBookingConfirmed } from '../sockets/socketHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { BOOKING_STATUS } from '../utils/constants.js';

export const holdSeats = async (req, res, next) => {
  try {
    const { showId, seats: seatNumbers } = req.body;

    if (!showId || !seatNumbers || !seatNumbers.length) {
      return errorResponse(res, 'Please provide showId and an array of seat numbers to reserve.', 400);
    }

    const holdResult = await seatReservationService.holdSeats({
      showId,
      seatNumbers,
      user: req.user
    });

    // Broadcast hold event to all users viewing this show
    broadcastSeatHold(showId, seatNumbers, holdResult.expiresAt);

    return successResponse(res, holdResult, 'Seats held temporarily! Please complete payment within the time limit.', 201);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message, statusCode);
  }
};

export const createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate('show');
    if (!booking) {
      return errorResponse(res, 'Booking not found.', 404);
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized booking access.', 403);
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      return errorResponse(res, `Booking is in ${booking.status} status and cannot accept payment.`, 400);
    }

    if (new Date(booking.expiresAt) < new Date()) {
      return errorResponse(res, 'Seat hold has expired. Please select seats again.', 400);
    }

    const orderData = await paymentService.createOrder({
      bookingReference: booking.bookingReference,
      amount: booking.grandTotal,
      currency: 'INR',
      user: req.user
    });

    return successResponse(res, {
      ...orderData,
      bookingReference: booking.bookingReference,
      bookingId: booking._id,
      grandTotal: booking.grandTotal
    });
  } catch (error) {
    next(error);
  }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const { bookingId, orderId, paymentId, signature, method, payload } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return errorResponse(res, 'Booking not found.', 404);
    }

    // Server-side payment verification
    const verification = await paymentService.verifyPayment({
      orderId,
      paymentId,
      signature,
      payload: { ...payload, method }
    });

    if (!verification.verified) {
      return errorResponse(res, `Payment verification failed: ${verification.reason || 'Invalid signature'}`, 400);
    }

    // Atomic confirmation of booking and seats
    const confirmedBooking = await seatReservationService.confirmBookingPayment({
      bookingId,
      paymentResult: {
        paymentId: verification.paymentId,
        method: verification.method,
        amount: req.body.amount || payload?.amount
      },
      user: req.user
    });

    // Broadcast confirmed seats to all clients
    const seatNumbers = confirmedBooking.seats.map((s) => s.seatNumber);
    broadcastBookingConfirmed(confirmedBooking.show._id.toString(), seatNumbers);

    return successResponse(res, confirmedBooking, 'Booking confirmed successfully! Enjoy the show.');
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message, statusCode);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'show',
        populate: ['movie', 'theatre', 'screen']
      })
      .sort({ createdAt: -1 });

    return successResponse(res, bookings);
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { _id: id };

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { bookingReference: id.toUpperCase() };
    }

    const booking = await Booking.findOne(query).populate({
      path: 'show',
      populate: ['movie', 'theatre', 'screen']
    });

    if (!booking) {
      return errorResponse(res, 'Booking not found.', 404);
    }

    // Ownership or admin check
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied.', 403);
    }

    return successResponse(res, booking);
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const isAdmin = req.user.role === 'admin';

    const result = await seatReservationService.cancelBooking({
      bookingId: id,
      user: req.user,
      reason,
      isAdmin
    });

    // Broadcast released seats
    const seatNumbers = result.booking.seats.map((s) => s.seatNumber);
    broadcastSeatRelease(result.booking.show._id.toString(), seatNumbers);

    return successResponse(res, result, 'Booking cancelled and seats released successfully.');
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message, statusCode);
  }
};

export const getTicketData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate({
      path: 'show',
      populate: ['movie', 'theatre', 'screen']
    });

    if (!booking) {
      return errorResponse(res, 'Booking not found.', 404);
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied.', 403);
    }

    return successResponse(res, {
      bookingReference: booking.bookingReference,
      status: booking.status,
      movie: {
        title: booking.show.movie?.title,
        posterUrl: booking.show.movie?.posterUrl,
        certification: booking.show.movie?.certification,
        duration: booking.show.movie?.duration,
        languages: booking.show.movie?.languages
      },
      theatre: {
        name: booking.show.theatre?.name,
        address: booking.show.theatre?.address,
        city: booking.show.theatre?.city
      },
      screen: {
        name: booking.show.screen?.name,
        screenType: booking.show.screen?.screenType
      },
      showTime: booking.show.startTime,
      seats: booking.seats,
      pricing: {
        totalAmount: booking.totalAmount,
        convenienceFee: booking.convenienceFee,
        grandTotal: booking.grandTotal
      },
      payment: {
        status: booking.paymentStatus,
        reference: booking.paymentReference
      },
      qrCode: booking.qrCode,
      bookedAt: booking.createdAt
    });
  } catch (error) {
    next(error);
  }
};
