import { Types } from 'mongoose';
import { logger } from '@utils/logger';
import { AuctionService } from '@services/auction.service';
import { IAuctionRepository } from '@repositories/interfaces/IAuctionRepository';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';
import { IPlayerRepository } from '@repositories/interfaces/IPlayerRepository';
import { IOwnerRepository } from '@repositories/interfaces/IOwnerRepository';
import { IBidRepository } from '@repositories/interfaces/IBidRepository';
import { IAuditLogRepository } from '@repositories/interfaces/IAuditLogRepository';

export interface SessionResetSummary {
  auctions: number;
  teams: number;
  players: number;
  owners: number;
  bids: number;
  auditLogs: number;
}

/**
 * Wipes every entity that belongs to an auction "session" — Teams, Players,
 * Owners, Captains, Auctions (with their embedded round/bid state), Bids,
 * and AuditLogs — so the admin can start a brand-new reunion tournament
 * with a clean slate. User accounts are deliberately never touched here;
 * that guarantee is also enforced independently at the repository layer
 * (UserRepository.deleteAll is disabled).
 */
export class SessionResetService {
  constructor(
    private readonly auctionRepository: IAuctionRepository,
    private readonly teamRepository: ITeamRepository,
    private readonly playerRepository: IPlayerRepository,
    private readonly ownerRepository: IOwnerRepository,
    private readonly bidRepository: IBidRepository,
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly auctionService?: AuctionService,
  ) {}

  async resetSession(actorId: string): Promise<SessionResetSummary> {
    try {
      this.auctionService?.clearAllInMemoryState?.();
    } catch (e) {
      logger.warn('Failed to clear in-memory auction state:', e);
    }

    const [auctions, teams, players, owners, bids] = await Promise.all([
      this.auctionRepository.deleteAll().catch(() => 0),
      this.teamRepository.deleteAll().catch(() => 0),
      this.playerRepository.deleteAll().catch(() => 0),
      this.ownerRepository.deleteAll().catch(() => 0),
      this.bidRepository.deleteAll().catch(() => 0),
    ]);

    let auditLogs = 0;
    try {
      if (actorId && Types.ObjectId.isValid(actorId)) {
        await this.auditLogRepository.record({
          actor: actorId,
          action: 'session.reset',
          entityType: 'Session',
          entityId: 'all',
          after: { auctions, teams, players, owners, bids },
        });
      }
      auditLogs = await this.auditLogRepository.deleteAll();
    } catch (e) {
      logger.warn('Failed to record session reset audit log:', e);
      auditLogs = await this.auditLogRepository.deleteAll().catch(() => 0);
    }

    logger.info('Session reset completed', { actorId, auctions, teams, players, owners, bids, auditLogs });

    return { auctions, teams, players, owners, bids, auditLogs };
  }
}


