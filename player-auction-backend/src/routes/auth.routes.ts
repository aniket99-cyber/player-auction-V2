import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { AuthService } from '@services/auth.service';
import { UserRepository } from '@repositories/implementations/UserRepository';
import { validate } from '@middleware/validate.middleware';
import { authenticate } from '@middleware/auth.middleware';
import { loginSchema, refreshSchema, registerSchema } from '@validators/auth.validator';
import { asyncHandler } from '@utils/asyncHandler';

const router = Router();

const authService = new AuthService(new UserRepository());
const authController = new AuthController(authService);

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', authenticate, asyncHandler(authController.logout));

export const authRoutes = router;
