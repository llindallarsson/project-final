import { mkdirSync } from 'fs';
import path from 'path';
import multer from 'multer';

// Ensure uploads directory exists
function ensureUploadsDir(dir) {
  try {
    mkdirSync(dir, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}

// Shared disk storage for photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads');
    ensureUploadsDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export default { upload, ensureUploadsDir };
