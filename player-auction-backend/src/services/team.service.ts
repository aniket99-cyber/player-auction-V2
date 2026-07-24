import { ApiError } from '@utils/ApiError';
import { eventBus } from '@events/EventBus';
import { ITeam } from '@models/Team.model';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';
import { IPlayerRepository } from '@repositories/interfaces/IPlayerRepository';
import { IAuditLogRepository } from '@repositories/interfaces/IAuditLogRepository';

interface CreateTeamInput {
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  owner: string;
  totalBudget: number;
  season: string;
}

interface UpdateTeamInput {
  name?: string;
  shortName?: string;
  logoUrl?: string;
  logoPublicId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  captain?: string;
  totalBudget?: number;
}

interface AddRetentionInput {
  teamId: string;
  playerId: string;
  retentionPrice: number;
  retentionOrder: number;
  approvedBy: string;
}

export class TeamService {
  constructor(
    private readonly teamRepository: ITeamRepository,
    private readonly playerRepository: IPlayerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async createTeam(input: CreateTeamInput, actorId: string): Promise<ITeam> {
    const existing = await this.teamRepository.findOne({ name: input.name, season: input.season });
    if (existing) {
      throw ApiError.conflict(`A team named "${input.name}" already exists for season ${input.season}`);
    }

    const team = await this.teamRepository.create({
      ...input,
      remainingBudget: input.totalBudget,
      players: [],
      retentions: [],
    } as never);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'team.created',
      entityType: 'Team',
      entityId: team._id.toString(),
      after: team.toObject(),
    });

    eventBus.emit('team.created', { team });
    return team;
  }

  async updateTeam(teamId: string, input: UpdateTeamInput, actorId: string): Promise<ITeam> {
    const before = await this.teamRepository.findById(teamId);
    if (!before) {
      throw ApiError.notFound('Team not found');
    }

    if (input.captain) {
      const isOnRoster = before.players.some((p) => p.toString() === input.captain);
      if (!isOnRoster) {
        throw ApiError.badRequest('Captain must be a player already on this team\'s roster');
      }
    }

    const updated = await this.teamRepository.updateById(teamId, input as Partial<ITeam>);
    if (!updated) {
      throw ApiError.notFound('Team not found');
    }

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'team.updated',
      entityType: 'Team',
      entityId: teamId,
      before: before.toObject(),
      after: updated.toObject(),
    });

    eventBus.emit('team.updated', { team: updated });
    return updated;
  }

  async addRetention(input: AddRetentionInput): Promise<ITeam> {
    const player = await this.playerRepository.findById(input.playerId);
    if (!player) {
      throw ApiError.notFound('Player not found');
    }

    const team = await this.teamRepository.addRetention(input.teamId, {
      player: input.playerId,
      retentionPrice: input.retentionPrice,
      retentionOrder: input.retentionOrder,
      approvedBy: input.approvedBy,
    });

    if (!team) {
      throw ApiError.badRequest('Insufficient budget for this retention, or team not found');
    }

    await this.playerRepository.updateById(input.playerId, {
      isRetained: true,
      auctionStatus: 'RETAINED',
    } as never);

    await this.auditLogRepository.record({
      actor: input.approvedBy,
      action: 'team.retentionAdded',
      entityType: 'Team',
      entityId: input.teamId,
      after: { player: input.playerId, retentionPrice: input.retentionPrice },
    });

    eventBus.emit('team.retentionAdded', { team });
    return team;
  }

  async softDeleteTeam(teamId: string, actorId: string): Promise<void> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw ApiError.notFound('Team not found');
    }

    await this.teamRepository.softDelete(teamId, actorId);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'team.deleted',
      entityType: 'Team',
      entityId: teamId,
      before: team.toObject(),
    });

    eventBus.emit('team.deleted', { teamId });
  }

  async restoreTeam(teamId: string, actorId: string): Promise<ITeam> {
    const team = await this.teamRepository.findByIdIncludingDeleted(teamId);
    if (!team || !team.isDeleted) {
      throw ApiError.notFound('Deleted team not found');
    }

    const restored = await this.teamRepository.restore(teamId);
    if (!restored) {
      throw ApiError.notFound('Team not found');
    }

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'team.restored',
      entityType: 'Team',
      entityId: teamId,
      after: restored.toObject(),
    });

    eventBus.emit('team.restored', { team: restored });
    return restored;
  }

  async listDeletedTeams(): Promise<ITeam[]> {
    return this.teamRepository.findDeleted();
  }

  async bulkUpdateStatus(teamIds: string[], isDeleted: boolean, actorId: string): Promise<number> {
    const modifiedCount = await this.teamRepository.bulkUpdateStatus(teamIds, isDeleted);

    await this.auditLogRepository.record({
      actor: actorId,
      action: isDeleted ? 'team.bulkDeleted' : 'team.bulkRestored',
      entityType: 'Team',
      entityId: teamIds.join(','),
      after: { teamIds, isDeleted },
    });

    eventBus.emit('team.bulkStatusChanged', { teamIds, isDeleted });
    return modifiedCount;
  }

  async getAuditHistory(teamId: string) {
    return this.auditLogRepository.findByEntity('Team', teamId);
  }
}
