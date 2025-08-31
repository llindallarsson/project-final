import express from 'express';
import authController from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.put('/me/email', auth, authController.updateEmail);
router.put('/me/password', auth, authController.updatePassword);
router.delete('/me', auth, authController.deleteMe);

export default router;
