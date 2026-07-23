import { Router } from 'express';
import { authRoutes } from '@routes/auth.routes';
import { teamRoutes } from '@routes/team.routes';
import { playerRoutes } from '@routes/player.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);

export const apiRouter = router;
