import { Router } from 'express';
import { AuthController, authenticateToken } from '../controllers/authControllerDb';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema } from '../validators/authValidators';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validate(loginSchema), authController.login);
router.post('/platform-login', validate(loginSchema), authController.platformLogin);
router.post('/register', validate(registerSchema), authController.register);
router.get('/verify', authController.verifyToken);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/me', authenticateToken, authController.getProfile);
router.patch('/me', authenticateToken, authController.updateProfile);

export default router;
