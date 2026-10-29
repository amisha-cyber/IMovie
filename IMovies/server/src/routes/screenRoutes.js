import { Router } from 'express';
import { getScreenById, updateScreen, deleteScreen } from '../controllers/screenController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { updateScreenValidator } from '../validators/screenValidator.js';

const router = Router();

router.get('/:id', getScreenById);
router.patch('/:id', authenticate, requireAdmin, updateScreenValidator, updateScreen);
router.delete('/:id', authenticate, requireAdmin, deleteScreen);

export default router;
