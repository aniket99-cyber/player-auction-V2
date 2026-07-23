import { Router } from 'express';
import { PlayerController } from '@controllers/player.controller';
import { PlayerService } from '@services/player.service';
import { PlayerImportService } from '@services/player-import.service';
import { PlayerRepository } from '@repositories/implementations/PlayerRepository';
import { AuditLogRepository } from '@repositories/implementations/AuditLogRepository';
import { validate } from '@middleware/validate.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { uploadImage, uploadImportFile } from '@middleware/upload.middleware';
import {
  bulkAuctionStatusSchema,
  bulkStatusSchema,
  createPlayerSchema,
  updatePlayerSchema,
} from '@validators/player.validator';
import { asyncHandler } from '@utils/asyncHandler';
import { UserRole } from '@constants/enums';

const router = Router();

const playerRepository = new PlayerRepository();
const playerService = new PlayerService(playerRepository, new AuditLogRepository());
const playerImportService = new PlayerImportService(new AuditLogRepository());
const playerController = new PlayerController(playerService, playerImportService, playerRepository);

router.use(authenticate);

// Static/action sub-paths must be registered before the generic '/:id' route
// so Express doesn't try to parse them as an ObjectId.
router.get('/deleted', authorize(UserRole.ADMIN), asyncHandler(playerController.listDeleted));

router.post(
  '/import/csv',
  authorize(UserRole.ADMIN),
  uploadImportFile.single('file'),
  asyncHandler(playerController.importCsv),
);

router.post(
  '/import/excel',
  authorize(UserRole.ADMIN),
  uploadImportFile.single('file'),
  asyncHandler(playerController.importExcel),
);

router.patch(
  '/bulk-status',
  authorize(UserRole.ADMIN),
  validate(bulkStatusSchema),
  asyncHandler(playerController.bulkUpdateStatus),
);

router.patch(
  '/bulk-auction-status',
  authorize(UserRole.ADMIN),
  validate(bulkAuctionStatusSchema),
  asyncHandler(playerController.bulkUpdateAuctionStatus),
);

router.get('/', asyncHandler(playerController.list));
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createPlayerSchema),
  asyncHandler(playerController.create),
);

router.get('/:id', asyncHandler(playerController.getById));
router.patch(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updatePlayerSchema),
  asyncHandler(playerController.update),
);
router.delete('/:id', authorize(UserRole.ADMIN), asyncHandler(playerController.softDelete));

router.post('/:id/restore', authorize(UserRole.ADMIN), asyncHandler(playerController.restore));

router.post(
  '/:id/image',
  authorize(UserRole.ADMIN),
  uploadImage.single('image'),
  asyncHandler(playerController.uploadImage),
);

router.get(
  '/:id/audit-history',
  authorize(UserRole.ADMIN),
  asyncHandler(playerController.auditHistory),
);

export const playerRoutes = router;
