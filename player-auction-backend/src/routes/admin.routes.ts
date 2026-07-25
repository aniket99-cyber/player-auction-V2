import { Router } from 'express';
import { AdminController } from '@controllers/admin.controller';
import { SessionResetService } from '@services/session-reset.service';
import { AuctionService } from '@services/auction.service';
import { AuctionRepository } from '@repositories/implementations/AuctionRepository';
import { TeamRepository } from '@repositories/implementations/TeamRepository';
import { PlayerRepository } from '@repositories/implementations/PlayerRepository';
import { OwnerRepository } from '@repositories/implementations/OwnerRepository';
import { BidRepository } from '@repositories/implementations/BidRepository';
import { AuditLogRepository } from '@repositories/implementations/AuditLogRepository';
import { SettingsRepository } from '@repositories/implementations/SettingsRepository';
import { validate } from '@middleware/validate.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { updateSettingsSchema } from '@validators/settings.validator';
import { asyncHandler } from '@utils/asyncHandler';
import { UserRole } from '@constants/enums';

const router = Router();

const auctionService = new AuctionService(
  new AuctionRepository(),
  new TeamRepository(),
  new PlayerRepository(),
  new AuditLogRepository(),
  new SettingsRepository(),
);

const sessionResetService = new SessionResetService(
  new AuctionRepository(),
  new TeamRepository(),
  new PlayerRepository(),
  new OwnerRepository(),
  new BidRepository(),
  new AuditLogRepository(),
  auctionService,
);
const adminController = new AdminController(sessionResetService, new SettingsRepository());

router.post(
  '/reset-session',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(adminController.resetSession),
);

// Reads are open to everyone — needed by public Live Viewer & forms.
// Only changing the settings is admin-only.
router.get('/settings', asyncHandler(adminController.getSettings));
router.patch(
  '/settings',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateSettingsSchema),
  asyncHandler(adminController.updateSettings),
);

export const adminRoutes = router;
