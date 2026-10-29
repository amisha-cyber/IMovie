import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Screen } from '../models/Screen.js';
import { Show } from '../models/Show.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';
import { BOOKING_STATUS, PAYMENT_STATUS, SHOW_STATUS } from '../utils/constants.js';
import { escapeRegex } from '../utils/regex.js';

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      totalMovies,
      theatresList,
      totalScreens,
      upcomingShows,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      recentBookings,
      revenueResult
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Movie.countDocuments({ status: { $ne: 'archived' } }),
      Theatre.find({ isActive: true }).sort({ name: 1 }).lean(),
      Screen.countDocuments({ isActive: true }),
      Show.countDocuments({ startTime: { $gte: now }, status: SHOW_STATUS.SCHEDULED }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED }),
      Booking.countDocuments({ status: BOOKING_STATUS.CANCELLED }),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('user', 'name email')
        .populate({
          path: 'show',
          populate: ['movie', 'theatre']
        }),
      // Authoritative revenue aggregation: ONLY successful payments
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.SUCCESS } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ])
    ]);

    const activeTheatres = theatresList.length;
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Attach screens count to each theatre in list
    const theatreIds = theatresList.map((t) => t._id);
    const screens = await Screen.find({ theatre: { $in: theatreIds }, isActive: true })
      .select('theatre name screenType')
      .lean();

    const screensByTheatre = {};
    for (const screen of screens) {
      const tId = screen.theatre.toString();
      if (!screensByTheatre[tId]) screensByTheatre[tId] = [];
      screensByTheatre[tId].push(screen);
    }

    const populatedTheatres = theatresList.map((t) => ({
      ...t,
      screens: screensByTheatre[t._id.toString()] || [],
      screenCount: (screensByTheatre[t._id.toString()] || []).length
    }));

    // 7-day revenue trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueTrend = await Payment.aggregate([
      {
        $match: {
          status: PAYMENT_STATUS.SUCCESS,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return successResponse(res, {
      stats: {
        totalUsers,
        totalMovies,
        activeTheatres,
        totalScreens,
        upcomingShows,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue
      },
      theatres: populatedTheatres,
      recentBookings,
      revenueTrend
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.bookingReference = new RegExp(escapeRegex(search.trim()), 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email phone')
        .populate({
          path: 'show',
          populate: ['movie', 'theatre', 'screen']
        }),
      Booking.countDocuments(query)
    ]);

    return paginatedResponse(res, bookings, { total, page: pageNum, limit: limitNum });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 15 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    return paginatedResponse(res, users, { total, page: pageNum, limit: limitNum });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'You cannot suspend your own administrator account.', 400);
    }

    user.accountStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    await user.save();

    return successResponse(
      res,
      user.toSafeObject(),
      `User account ${user.accountStatus === 'active' ? 'activated' : 'suspended'} successfully.`
    );
  } catch (error) {
    next(error);
  }
};
