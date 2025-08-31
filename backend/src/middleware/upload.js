import multer from 'multer';
import path from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

// ES6 replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safe);
  },
});

export default multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
