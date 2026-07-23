import { Router } from 'express';
import { AuctionController } from '@controllers/auction.controller';
import { AuctionService } from '@services/auction.service';
import { AuctionRepository } from '@repositories/implementations/AuctionRepository';
import { BidRepository } from '@repositories/implementations/BidRepository';
import { TeamRepository } from '@repositories/implementations/TeamRepository';
import { PlayerRepository } from '@repositories/implementations/PlayerRepository';
import { AuditLogRepository } from '@repositories/implementations/AuditLogRepository';
import { validate } from '@middleware/validate.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { createAuctionSchema, updateAuctionQueueSchema } from '@validators/auction.validator';
import { asyncHandler } from '@utils/asyncHandler';
import { UserRole } from '@constants/enums';

const router = Router();

const auctionRepository = new AuctionRepository();
export const auctionService = new AuctionService(
  auctionRepository,
  new TeamRepository(),
  new PlayerRepository(),
  new AuditLogRepository(),
);
const auctionController = new AuctionController(auctionService, auctionRepository, new BidRepository());

// Public reads: the Live Viewer needs auction state and bid history with no
// login. Every mutating/lifecycle route below stays behind `authenticate`.
router.get('/', asyncHandler(auctionController.list));
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createAuctionSchema),
  asyncHandler(auctionController.create),
);

router.get('/:id', asyncHandler(auctionController.getById));
router.patch(
  '/:id/queue',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateAuctionQueueSchema),
  asyncHandler(auctionController.updateQueue),
);

router.post('/:id/start', authenticate, authorize(UserRole.ADMIN), asyncHandler(auctionController.start));
router.post('/:id/pause', authenticate, authorize(UserRole.ADMIN), asyncHandler(auctionController.pause));
router.post('/:id/resume', authenticate, authorize(UserRole.ADMIN), asyncHandler(auctionController.resume));
router.post('/:id/next', authenticate, authorize(UserRole.ADMIN), asyncHandler(auctionController.next));
router.post('/:id/skip', authenticate, authorize(UserRole.ADMIN), asyncHandler(auctionController.skip));
router.post(
  '/:id/finalize',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(auctionController.finalize),
);
router.post(
  '/:id/confirm-sale',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(auctionController.confirmSale),
);
router.post(
  '/:id/start-next-round',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(auctionController.startNextRound),
);

router.get('/:id/bids', asyncHandler(auctionController.bidHistory));

export const auctionRoutes = router;
