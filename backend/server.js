import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES6 replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env i backend/.env
const envPath = path.join(__dirname, '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

import { connectDB } from './src/config/db.js';
import { errorHandler, notFound } from './src/middleware/error.js';

// Routers
import authRoutes from './src/routes/authRoutes.js';
import tripRoutes from './src/routes/tripRoutes.js';
import boatRoutes from './src/routes/boatRoutes.js';
import placeRoutes from './src/routes/placeRoutes.js';
import trackingRoutes from './src/routes/trackingRoutes.js';

const app = express();
const PORT = process.env.PORT || 8080;

/* Security & parsing */
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  })
);
app.use(express.json({ limit: '2mb' }));

/* Static uploads */
const uploadsDir = path.join(__dirname, 'uploads');
mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

/* Health */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* DB */
console.log('Connecting MongoDB:', (process.env.MONGO_URL || '').slice(0, 40) + '…');
connectDB(process.env.MONGO_URL);

/* Routes */
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/boats', boatRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/tracking', trackingRoutes);

/* 404 + errors */
app.use(notFound);
app.use(errorHandler);

/* Start */
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
