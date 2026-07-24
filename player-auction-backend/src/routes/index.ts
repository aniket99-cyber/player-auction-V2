import { Router } from 'express';
import { authRoutes } from '@routes/auth.routes';
import { teamRoutes } from '@routes/team.routes';
import { playerRoutes } from '@routes/player.routes';
import { auctionRoutes } from '@routes/auction.routes';
import { ownerRoutes } from '@routes/owner.routes';
import { adminRoutes } from '@routes/admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);
router.use('/auctions', auctionRoutes);
router.use('/owners', ownerRoutes);
router.use('/admin', adminRoutes);

export const apiRouter = router;
