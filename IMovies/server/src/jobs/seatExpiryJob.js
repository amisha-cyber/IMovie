import { seatReservationService } from '../services/seatReservationService.js';
import { broadcastSeatRelease } from '../sockets/socketHandler.js';
import { logger } from '../utils/logger.js';

let intervalId = null;

export const startSeatExpiryJob = (intervalMs = 15000) => {
  if (intervalId) return;

  logger.info(`Starting seat hold expiry background worker (interval: ${intervalMs / 1000}s)`);

  intervalId = setInterval(async () => {
    try {
      const expiredSeats = await seatReservationService.releaseExpiredHolds();
      if (expiredSeats.length > 0) {
        logger.info(`Released ${expiredSeats.length} expired seat holds.`);
        // Group by showId and broadcast
        const showsMap = {};
        for (const seat of expiredSeats) {
          const showIdStr = seat.show.toString();
          if (!showsMap[showIdStr]) showsMap[showIdStr] = [];
          showsMap[showIdStr].push(seat.seatNumber);
        }

        for (const [showId, seats] of Object.entries(showsMap)) {
          broadcastSeatRelease(showId, seats);
        }
      }
    } catch (err) {
      logger.error('Error during seat expiry job:', err.message);
    }
  }, intervalMs);
};

export const stopSeatExpiryJob = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Stopped seat hold expiry background worker.');
  }
};
