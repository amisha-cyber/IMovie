import { Router } from 'express';
import { getShowSeats } from '../controllers/seatController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Allows guest or authenticated user to fetch seat layout
router.get('/shows/:showId/seats', optionalAuth, getShowSeats);

export default router;
