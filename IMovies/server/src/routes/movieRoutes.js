import { Router } from 'express';
import { getMovies, getMovieById, createMovie, updateMovie, deleteMovie } from '../controllers/movieController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { successResponse } from '../utils/apiResponse.js';
import { createMovieValidator, updateMovieValidator } from '../validators/movieValidator.js';

const router = Router();

// Public routes
router.get('/', getMovies);
router.get('/:id', getMovieById);

// Admin-only routes
router.post('/', authenticate, requireAdmin, createMovieValidator, createMovie);
router.patch('/:id', authenticate, requireAdmin, updateMovieValidator, updateMovie);
router.delete('/:id', authenticate, requireAdmin, deleteMovie);

// Admin image upload helper
router.post('/upload', authenticate, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return successResponse(res, { url: fileUrl }, 'Image uploaded successfully.');
});

export default router;
