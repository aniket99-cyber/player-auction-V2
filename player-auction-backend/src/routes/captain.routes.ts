import { Router } from 'express';
import { CaptainController } from '@controllers/captain.controller';
import { CaptainRepository } from '@repositories/implementations/CaptainRepository';
import { validate } from '@middleware/validate.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { createCaptainSchema, updateCaptainSchema } from '@validators/captain.validator';
import { asyncHandler } from '@utils/asyncHandler';
import { UserRole } from '@constants/enums';

const router = Router();

const captainController = new CaptainController(new CaptainRepository());

// Public reads — captain display cards are shown on the Live Viewer too.
router.get('/', asyncHandler(captainController.list));
router.get('/team/:teamId', asyncHandler(captainController.getByTeam));
router.get('/:id', asyncHandler(captainController.getById));

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createCaptainSchema),
  asyncHandler(captainController.create),
);
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateCaptainSchema),
  asyncHandler(captainController.update),
);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), asyncHandler(captainController.delete));

export const captainRoutes = router;
