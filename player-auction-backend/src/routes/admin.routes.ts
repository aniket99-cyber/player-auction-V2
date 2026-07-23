import { Router } from 'express';
import { AdminController } from '@controllers/admin.controller';
import { SessionResetService } from '@services/session-reset.service';
import { auctionService } from '@routes/auction.routes';
import { AuctionRepository } from '@repositories/implementations/AuctionRepository';
import { TeamRepository } from '@repositories/implementations/TeamRepository';
import { PlayerRepository } from '@repositories/implementations/PlayerRepository';
import { OwnerRepository } from '@repositories/implementations/OwnerRepository';
import { CaptainRepository } from '@repositories/implementations/CaptainRepository';
import { BidRepository } from '@repositories/implementations/BidRepository';
import { AuditLogRepository } from '@repositories/implementations/AuditLogRepository';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { asyncHandler } from '@utils/asyncHandler';
import { UserRole } from '@constants/enums';

const router = Router();

const sessionResetService = new SessionResetService(
  new AuctionRepository(),
  new TeamRepository(),
  new PlayerRepository(),
  new OwnerRepository(),
  new CaptainRepository(),
  new BidRepository(),
  new AuditLogRepository(),
  auctionService,
);
const adminController = new AdminController(sessionResetService);

router.post(
  '/reset-session',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(adminController.resetSession),
);

export const adminRoutes = router;
