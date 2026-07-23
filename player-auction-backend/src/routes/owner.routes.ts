import { Router } from 'express';
import { OwnerController } from '@controllers/owner.controller';
import { OwnerRepository } from '@repositories/implementations/OwnerRepository';
import { validate } from '@middleware/validate.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { uploadImage } from '@middleware/upload.middleware';
import { createOwnerSchema, updateOwnerSchema } from '@validators/owner.validator';
import { asyncHandler } from '@utils/asyncHandler';
import { UserRole } from '@constants/enums';

const router = Router();

const ownerController = new OwnerController(new OwnerRepository());

// Public reads — owner display cards are shown on the Live Viewer too.
router.get('/', asyncHandler(ownerController.list));
router.get('/team/:teamId', asyncHandler(ownerController.getByTeam));
router.get('/:id', asyncHandler(ownerController.getById));

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createOwnerSchema),
  asyncHandler(ownerController.create),
);
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateOwnerSchema),
  asyncHandler(ownerController.update),
);
router.post(
  '/:id/image',
  authenticate,
  authorize(UserRole.ADMIN),
  uploadImage.single('image'),
  asyncHandler(ownerController.uploadImage),
);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), asyncHandler(ownerController.delete));

export const ownerRoutes = router;
