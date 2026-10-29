import { seatReservationService } from '../services/seatReservationService.js';
import { Show } from '../models/Show.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getShowSeats = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const currentUserId = req.user ? req.user._id : null;

    const show = await Show.findById(showId)
      .populate('movie')
      .populate('theatre')
      .populate('screen');

    if (!show) {
      return errorResponse(res, 'Show not found.', 404);
    }

    const seats = await seatReservationService.getShowSeatsAuthoritative(showId, currentUserId);

    const stats = {
      total: seats.length,
      available: seats.filter((s) => s.status === 'AVAILABLE').length,
      held: seats.filter((s) => s.status === 'HELD').length,
      booked: seats.filter((s) => s.status === 'BOOKED').length
    };

    return successResponse(res, {
      show: {
        id: show._id,
        movieTitle: show.movie?.title,
        theatreName: show.theatre?.name,
        screenName: show.screen?.name,
        screenType: show.screen?.screenType,
        startTime: show.startTime,
        endTime: show.endTime,
        seatPricing: show.seatPricing
      },
      stats,
      seats
    });
  } catch (error) {
    next(error);
  }
};
