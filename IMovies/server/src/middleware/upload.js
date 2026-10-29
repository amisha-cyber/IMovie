import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // Explicitly block SVG and XML to prevent stored XSS attacks
  if (ext === '.svg' || mime.includes('svg') || mime.includes('xml') || mime.includes('html')) {
    return cb(new Error('SVG and XML media uploads are strictly prohibited for security reasons.'), false);
  }

  const allowedExts = ['.jpeg', '.jpg', '.png', '.webp'];
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedExts.includes(ext) && allowedMimes.includes(mime)) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, JPG, PNG, and WebP image files are allowed.'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter
});
