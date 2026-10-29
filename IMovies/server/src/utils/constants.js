export const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const MOVIE_STATUS = {
  NOW_SHOWING: 'now_showing',
  COMING_SOON: 'coming_soon',
  ARCHIVED: 'archived'
};

export const SHOW_STATUS = {
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const SEAT_CATEGORY = {
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM'
};

export const SEAT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  HELD: 'HELD',
  BOOKED: 'BOOKED',
  BLOCKED: 'BLOCKED'
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const PAYMENT_PROVIDERS = {
  SIMULATED: 'simulated',
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe'
};

// Seat hold duration in minutes (standard cinema booking hold window)
export const HOLD_EXPIRY_MINUTES = 8;
export const CANCELLATION_CUTOFF_HOURS = 2; // Cancellations permitted up to 2 hours before showtime
