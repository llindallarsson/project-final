import express from 'express';
import tripController from '../controllers/tripController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', auth, tripController.listTrips);
router.post('/', auth, upload.array('photos', 10), tripController.createTrip);
router.get('/:id', auth, tripController.getTrip);
router.put('/:id', auth, upload.array('photos', 10), tripController.updateTrip);
router.delete('/:id', auth, tripController.deleteTrip);

export default router;
