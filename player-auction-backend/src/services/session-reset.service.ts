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
    private readonly auctionService: AuctionService,
  ) {}

  async resetSession(actorId: string): Promise<SessionResetSummary> {
    // Stop any live timers first — the Auction documents they reference are
    // about to disappear, and a callback firing against a deleted auction
    // would throw into an unhandled rejection.
    this.auctionService.clearAllInMemoryState();

    const [auctions, teams, players, owners, bids] = await Promise.all([
      this.auctionRepository.deleteAll(),
      this.teamRepository.deleteAll(),
      this.playerRepository.deleteAll(),
      this.ownerRepository.deleteAll(),
      this.bidRepository.deleteAll(),
    ]);

    // Record the reset itself before wiping AuditLog too, so the very last
    // audit entry describes the reset — then delete it along with the rest.
    await this.auditLogRepository.record({
      actor: actorId,
      action: 'session.reset',
      entityType: 'Session',
      entityId: 'all',
      after: { auctions, teams, players, owners, bids },
    });
    const auditLogs = await this.auditLogRepository.deleteAll();

    logger.info('Session reset completed', { actorId, auctions, teams, players, owners, bids, auditLogs });

    return { auctions, teams, players, owners, bids, auditLogs };
  }
}
