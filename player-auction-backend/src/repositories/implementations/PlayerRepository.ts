import { IPlayer, PlayerModel } from '@models/Player.model';
import { PlayerAuctionStatus } from '@constants/enums';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IPlayerRepository } from '@repositories/interfaces/IPlayerRepository';

export class PlayerRepository extends BaseRepository<IPlayer> implements IPlayerRepository {
  constructor() {
    super(PlayerModel);
  }

  async findByAuctionStatus(status: PlayerAuctionStatus): Promise<IPlayer[]> {
    return this.model.find({ auctionStatus: status }).exec();
  }

  async markSold(playerId: string, teamId: string, finalPrice: number): Promise<IPlayer | null> {
    return this.model
      .findByIdAndUpdate(
        playerId,
        {
          auctionStatus: PlayerAuctionStatus.SOLD,
          soldTo: teamId,
          soldPrice: finalPrice,
        },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async markUnsold(playerId: string): Promise<IPlayer | null> {
    return this.model
      .findByIdAndUpdate(playerId, { auctionStatus: PlayerAuctionStatus.UNSOLD }, { new: true })
      .exec();
  }

  async findByIdIncludingDeleted(id: string): Promise<IPlayer | null> {
    return this.model.findById(id).setOptions({ includeDeleted: true }).exec();
  }

  async findDeleted(): Promise<IPlayer[]> {
    return this.model
      .find({ isDeleted: true })
      .setOptions({ includeDeleted: true })
      .sort({ deletedAt: -1 })
      .exec();
  }

  async softDelete(id: string, deletedBy: string): Promise<IPlayer | null> {
    return this.model
      .findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date(), deletedBy }, { new: true })
      .setOptions({ includeDeleted: true })
      .exec();
  }

  async restore(id: string): Promise<IPlayer | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { isDeleted: false, $unset: { deletedAt: '', deletedBy: '' } },
        { new: true },
      )
      .setOptions({ includeDeleted: true })
      .exec();
  }

  async bulkUpdateStatus(ids: string[], isDeleted: boolean): Promise<number> {
    const update = isDeleted
      ? { isDeleted: true, deletedAt: new Date() }
      : { isDeleted: false, $unset: { deletedAt: '', deletedBy: '' } };

    const result = await this.model
      .updateMany({ _id: { $in: ids } }, update)
      .setOptions({ includeDeleted: true })
      .exec();

    return result.modifiedCount;
  }

  async bulkUpdateAuctionStatus(ids: string[], auctionStatus: PlayerAuctionStatus): Promise<number> {
    const result = await this.model
      .updateMany({ _id: { $in: ids } }, { auctionStatus })
      .exec();
    return result.modifiedCount;
  }
}
