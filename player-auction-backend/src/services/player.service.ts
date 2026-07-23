import { ApiError } from '@utils/ApiError';
import { eventBus } from '@events/EventBus';
import { IPlayer } from '@models/Player.model';
import { PlayerAuctionStatus, PlayerRole } from '@constants/enums';
import { IPlayerRepository } from '@repositories/interfaces/IPlayerRepository';
import { IAuditLogRepository } from '@repositories/interfaces/IAuditLogRepository';

interface CreatePlayerInput {
  name: string;
  role: PlayerRole;
  country: string;
  age?: number;
  basePrice: number;
  imageUrl?: string;
  stats?: {
    matches?: number;
    runs?: number;
    wickets?: number;
    average?: number;
    strikeRate?: number;
  };
}

interface UpdatePlayerInput {
  name?: string;
  role?: PlayerRole;
  country?: string;
  age?: number;
  basePrice?: number;
  imageUrl?: string;
  stats?: CreatePlayerInput['stats'];
}

export class PlayerService {
  constructor(
    private readonly playerRepository: IPlayerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async createPlayer(input: CreatePlayerInput, actorId: string): Promise<IPlayer> {
    const player = await this.playerRepository.create({
      ...input,
      auctionStatus: PlayerAuctionStatus.PENDING,
      isRetained: false,
    } as never);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'player.created',
      entityType: 'Player',
      entityId: player._id.toString(),
      after: player.toObject(),
    });

    eventBus.emit('player.created', { player });
    return player;
  }

  async updatePlayer(playerId: string, input: UpdatePlayerInput, actorId: string): Promise<IPlayer> {
    const before = await this.playerRepository.findById(playerId);
    if (!before) {
      throw ApiError.notFound('Player not found');
    }

    const updated = await this.playerRepository.updateById(playerId, input as Partial<IPlayer>);
    if (!updated) {
      throw ApiError.notFound('Player not found');
    }

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'player.updated',
      entityType: 'Player',
      entityId: playerId,
      before: before.toObject(),
      after: updated.toObject(),
    });

    eventBus.emit('player.updated', { player: updated });
    return updated;
  }

  async softDeletePlayer(playerId: string, actorId: string): Promise<void> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw ApiError.notFound('Player not found');
    }

    await this.playerRepository.softDelete(playerId, actorId);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'player.deleted',
      entityType: 'Player',
      entityId: playerId,
      before: player.toObject(),
    });

    eventBus.emit('player.deleted', { playerId });
  }

  async restorePlayer(playerId: string, actorId: string): Promise<IPlayer> {
    const player = await this.playerRepository.findByIdIncludingDeleted(playerId);
    if (!player || !player.isDeleted) {
      throw ApiError.notFound('Deleted player not found');
    }

    const restored = await this.playerRepository.restore(playerId);
    if (!restored) {
      throw ApiError.notFound('Player not found');
    }

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'player.restored',
      entityType: 'Player',
      entityId: playerId,
      after: restored.toObject(),
    });

    eventBus.emit('player.restored', { player: restored });
    return restored;
  }

  async listDeletedPlayers(): Promise<IPlayer[]> {
    return this.playerRepository.findDeleted();
  }

  async bulkUpdateStatus(playerIds: string[], isDeleted: boolean, actorId: string): Promise<number> {
    const modifiedCount = await this.playerRepository.bulkUpdateStatus(playerIds, isDeleted);

    await this.auditLogRepository.record({
      actor: actorId,
      action: isDeleted ? 'player.bulkDeleted' : 'player.bulkRestored',
      entityType: 'Player',
      entityId: playerIds.join(','),
      after: { playerIds, isDeleted },
    });

    eventBus.emit('player.bulkStatusChanged', { playerIds, isDeleted });
    return modifiedCount;
  }

  async bulkUpdateAuctionStatus(
    playerIds: string[],
    auctionStatus: PlayerAuctionStatus,
    actorId: string,
  ): Promise<number> {
    const modifiedCount = await this.playerRepository.bulkUpdateAuctionStatus(playerIds, auctionStatus);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'player.bulkAuctionStatusChanged',
      entityType: 'Player',
      entityId: playerIds.join(','),
      after: { playerIds, auctionStatus },
    });

    return modifiedCount;
  }

  async getAuditHistory(playerId: string) {
    return this.auditLogRepository.findByEntity('Player', playerId);
  }
}
