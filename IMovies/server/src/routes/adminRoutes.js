import { Router } from 'express';
import { param } from 'express-validator';
import { getDashboardAnalytics, getAllBookings, getAllUsers, toggleUserStatus } from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/analytics', getDashboardAnalytics);
router.get('/bookings', getAllBookings);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', param('id').isMongoId().withMessage('Invalid user ID'), validate, toggleUserStatus);

export default router;
