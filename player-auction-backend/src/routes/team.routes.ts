import { Router } from 'express';
import { TeamController } from '@controllers/team.controller';
import { TeamService } from '@services/team.service';
import { TeamImportService } from '@services/team-import.service';
import { TeamRepository } from '@repositories/implementations/TeamRepository';
import { PlayerRepository } from '@repositories/implementations/PlayerRepository';
import { AuditLogRepository } from '@repositories/implementations/AuditLogRepository';
import { validate } from '@middleware/validate.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { uploadImage, uploadImportFile } from '@middleware/upload.middleware';
import {
  addRetentionSchema,
  bulkStatusSchema,
  createTeamSchema,
  updateTeamSchema,
} from '@validators/team.validator';
import { asyncHandler } from '@utils/asyncHandler';
import { UserRole } from '@constants/enums';

const router = Router();

const teamRepository = new TeamRepository();
const teamService = new TeamService(teamRepository, new PlayerRepository(), new AuditLogRepository());
const teamImportService = new TeamImportService(teamRepository, new AuditLogRepository());
const teamController = new TeamController(teamService, teamImportService, teamRepository);

router.use(authenticate);

// Static/action sub-paths must be registered before the generic '/:id' route
// so Express doesn't try to parse them as an ObjectId.
router.get('/deleted', authorize(UserRole.ADMIN), asyncHandler(teamController.listDeleted));

router.post(
  '/import/csv',
  authorize(UserRole.ADMIN),
  uploadImportFile.single('file'),
  asyncHandler(teamController.importCsv),
);

router.post(
  '/import/excel',
  authorize(UserRole.ADMIN),
  uploadImportFile.single('file'),
  asyncHandler(teamController.importExcel),
);

router.patch(
  '/bulk-status',
  authorize(UserRole.ADMIN),
  validate(bulkStatusSchema),
  asyncHandler(teamController.bulkUpdateStatus),
);

router.get('/', asyncHandler(teamController.list));
router.post('/', authorize(UserRole.ADMIN), validate(createTeamSchema), asyncHandler(teamController.create));

router.get('/:id', asyncHandler(teamController.getById));
router.patch(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updateTeamSchema),
  asyncHandler(teamController.update),
);
router.delete('/:id', authorize(UserRole.ADMIN), asyncHandler(teamController.softDelete));

router.post('/:id/restore', authorize(UserRole.ADMIN), asyncHandler(teamController.restore));

router.post(
  '/:id/logo',
  authorize(UserRole.ADMIN),
  uploadImage.single('logo'),
  asyncHandler(teamController.uploadLogo),
);

router.post(
  '/:id/retentions',
  authorize(UserRole.ADMIN),
  validate(addRetentionSchema),
  asyncHandler(teamController.addRetention),
);

router.get('/:id/audit-history', authorize(UserRole.ADMIN), asyncHandler(teamController.auditHistory));

export const teamRoutes = router;
