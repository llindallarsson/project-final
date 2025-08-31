import express from 'express';
import trackingController from '../controllers/trackingController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/start', auth, trackingController.startSession);
router.post('/:id/point', auth, trackingController.addPoint);
router.post('/:id/stop', auth, trackingController.stopSession);

export default router;
