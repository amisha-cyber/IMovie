import { Router } from 'express';
import authRoutes from './authRoutes.js';
import movieRoutes from './movieRoutes.js';
import theatreRoutes from './theatreRoutes.js';
import screenRoutes from './screenRoutes.js';
import showRoutes from './showRoutes.js';
import seatRoutes from './seatRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import adminRoutes from './adminRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/theatres', theatreRoutes);
router.use('/screens', screenRoutes);
router.use('/shows', showRoutes);
router.use('/', seatRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);

export default router;
