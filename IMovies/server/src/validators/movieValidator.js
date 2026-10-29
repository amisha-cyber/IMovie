import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';

const ALLOWED_IMAGE_DOMAINS = [
  'image.tmdb.org',
  'res.cloudinary.com',
  'm.media-amazon.com',
  'images.unsplash.com'
];

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  // Local upload path
  if (url.startsWith('/uploads/')) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return (
      ALLOWED_IMAGE_DOMAINS.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)) ||
      parsed.hostname.endsWith('.amazonaws.com')
    );
  } catch {
    return false;
  }
};

const isValidYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const isYouTube =
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtu.be' ||
      parsed.hostname === 'm.youtube.com';
    return isYouTube;
  } catch {
    return false;
  }
};

export const createMovieValidator = [
  body('title').trim().notEmpty().withMessage('Movie title is required').isLength({ max: 200 }),
  body('synopsis').trim().notEmpty().withMessage('Synopsis is required'),
  body('duration').isNumeric().withMessage('Duration must be a number of minutes').custom((v) => Number(v) > 0),
  body('releaseDate').notEmpty().withMessage('Release date is required').isISO8601().withMessage('Release date must be a valid date'),
  body('posterUrl')
    .notEmpty()
    .withMessage('Poster URL is required')
    .custom((url) => {
      if (!isValidImageUrl(url)) {
        throw new Error('Poster URL must be a valid HTTPS URL from an approved host (TMDB, Cloudinary, AWS S3, Unsplash) or /uploads/...');
      }
      return true;
    }),
  body('backdropUrl')
    .optional({ checkFalsy: true })
    .custom((url) => {
      if (!isValidImageUrl(url)) {
        throw new Error('Backdrop URL must be a valid HTTPS URL from an approved host or /uploads/...');
      }
      return true;
    }),
  body('trailerUrl')
    .optional({ checkFalsy: true })
    .custom((url) => {
      if (!isValidYouTubeUrl(url)) {
        throw new Error('Trailer URL must be a valid YouTube URL (youtube.com or youtu.be)');
      }
      return true;
    }),
  validate
];

export const updateMovieValidator = [
  param('id').isMongoId().withMessage('Invalid movie ID'),
  body('title').optional().trim().notEmpty().withMessage('Movie title cannot be empty').isLength({ max: 200 }),
  body('duration').optional().isNumeric().custom((v) => Number(v) > 0),
  body('releaseDate').optional().isISO8601().withMessage('Release date must be a valid date'),
  body('posterUrl')
    .optional({ checkFalsy: true })
    .custom((url) => {
      if (!isValidImageUrl(url)) {
        throw new Error('Poster URL must be a valid HTTPS URL from an approved host or /uploads/...');
      }
      return true;
    }),
  body('backdropUrl')
    .optional({ checkFalsy: true })
    .custom((url) => {
      if (!isValidImageUrl(url)) {
        throw new Error('Backdrop URL must be a valid HTTPS URL from an approved host or /uploads/...');
      }
      return true;
    }),
  body('trailerUrl')
    .optional({ checkFalsy: true })
    .custom((url) => {
      if (!isValidYouTubeUrl(url)) {
        throw new Error('Trailer URL must be a valid YouTube URL (youtube.com or youtu.be)');
      }
      return true;
    }),
  validate
];
