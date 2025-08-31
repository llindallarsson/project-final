import express from 'express';
import placeController from '../controllers/placeController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, placeController.listPlaces);
router.post('/', auth, placeController.createPlace);
router.delete('/:id', auth, placeController.deletePlace);

export default router;
