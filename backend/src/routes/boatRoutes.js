import express from 'express';
import boatController from '../controllers/boatController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, boatController.listBoats);
router.get('/:id', auth, boatController.getBoat);
router.post('/', auth, boatController.createBoat);
router.put('/:id', auth, boatController.updateBoat);
router.delete('/:id', auth, boatController.deleteBoat);

export default router;
