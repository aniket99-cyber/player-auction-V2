import { Router } from 'express';
import { PlayerController } from '@controllers/player.controller';
import { PlayerService } from '@services/player.service';
import { PlayerImportService } from '@services/player-import.service';
import { PlayerRepository } from '@repositories/implementations/PlayerRepository';
import { TeamRepository } from '@repositories/implementations/TeamRepository';
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
const playerService = new PlayerService(playerRepository, new AuditLogRepository(), new TeamRepository());
const playerImportService = new PlayerImportService(new AuditLogRepository());
const playerController = new PlayerController(playerService, playerImportService, playerRepository);

// Static/action sub-paths must be registered before the generic '/:id' route
// so Express doesn't try to parse them as an ObjectId.
router.get('/deleted', authenticate, authorize(UserRole.ADMIN), asyncHandler(playerController.listDeleted));

router.post(
  '/import/csv',
  authenticate,
  authorize(UserRole.ADMIN),
  uploadImportFile.single('file'),
  asyncHandler(playerController.importCsv),
);

router.post(
  '/import/excel',
  authenticate,
  authorize(UserRole.ADMIN),
  uploadImportFile.single('file'),
  asyncHandler(playerController.importExcel),
);

router.patch(
  '/bulk-status',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(bulkStatusSchema),
  asyncHandler(playerController.bulkUpdateStatus),
);

router.patch(
  '/bulk-auction-status',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(bulkAuctionStatusSchema),
  asyncHandler(playerController.bulkUpdateAuctionStatus),
);

router.post(
  '/reset-all',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(playerController.resetAll),
);

// Public reads: the Live Viewer needs player details (name, photo, stats)
// with no login. Every mutating route below stays behind `authenticate`.
router.get('/', asyncHandler(playerController.list));
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createPlayerSchema),
  asyncHandler(playerController.create),
);

router.get('/:id', asyncHandler(playerController.getById));
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updatePlayerSchema),
  asyncHandler(playerController.update),
);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), asyncHandler(playerController.softDelete));

router.post('/:id/restore', authenticate, authorize(UserRole.ADMIN), asyncHandler(playerController.restore));

router.post(
  '/:id/image',
  authenticate,
  authorize(UserRole.ADMIN),
  uploadImage.single('image'),
  asyncHandler(playerController.uploadImage),
);

router.get(
  '/:id/audit-history',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(playerController.auditHistory),
);

export const playerRoutes = router;
