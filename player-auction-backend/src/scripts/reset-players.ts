/**
 * Reset script: Clears all players and related auction data
 * while preserving teams, owners, and admin user.
 * 
 * Run with: npm run reset-players
 */
import crypto from 'crypto';

(globalThis as typeof globalThis & { crypto: typeof crypto }).crypto = crypto;

import { connectDatabase, disconnectDatabase } from '@config/database';
import { PlayerModel } from '@models/Player.model';
import { BidModel } from '@models/Bid.model';
import { AuctionModel } from '@models/Auction.model';
import { TeamModel } from '@models/Team.model';
import { logger } from '@utils/logger';

async function resetPlayers(): Promise<void> {
  await connectDatabase();
  logger.info('Starting player reset...');

  try {
    // 1. Get all player IDs for cascade cleanup
    const allPlayers = await PlayerModel.find({});
    const playerIds = allPlayers.map((p) => p._id);
    logger.info(`Found ${playerIds.length} players to delete`);

    // 2. Remove players from teams (clear roster, captain, retentions)
    await TeamModel.updateMany(
      {},
      {
        $pull: {
          players: { $in: playerIds },
          retentions: { player: { $in: playerIds } },
        },
        $set: {
          remainingBudget: 1000, // Reset budget
          totalBudget: 1000,
        },
        $unset: { currentCaptain: 1 }, // Clear any captain reference
      }
    );
    logger.info('Cleared players from teams and reset budget');

    // 3. Delete bids referencing these players
    await BidModel.deleteMany({ player: { $in: playerIds } });
    logger.info('Deleted related bids');

    // 4. Reset auction to DRAFT and clear player queue
    await AuctionModel.updateMany(
      {},
      {
        $set: {
          playerQueue: [],
          status: 'DRAFT',
          currentPlayer: null,
          currentRound: 0,
          bidsOnCurrentPlayer: [],
        },
      }
    );
    logger.info('Reset auctions to DRAFT state');

    // 6. Delete all players
    await PlayerModel.deleteMany({});
    logger.info('Deleted all players');

    logger.info('✓ Player reset complete. Teams preserved. Ready for fresh seed.');
  } catch (err) {
    logger.error('Reset failed', { message: (err as any).message, stack: (err as any).stack });
    throw err;
  }

  await disconnectDatabase();
}

resetPlayers().catch((err) => {
  logger.error('Script error', { message: (err as any).message });
  process.exit(1);
});
