import { Router } from 'express';
import { param } from 'express-validator';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

router.use(authenticate);

router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', param('id').isMongoId().withMessage('Invalid notification ID'), validate, markNotificationRead);

export default router;
