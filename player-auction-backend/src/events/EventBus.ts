import { EventEmitter } from 'node:events';
import type { IBid } from '@models/Bid.model';
import type { IPlayer } from '@models/Player.model';
import type { ITeam } from '@models/Team.model';

export interface DomainEventMap {
  'bid.placed': { auctionId: string; bid: IBid };
  'player.sold': { auctionId: string; player: IPlayer; teamId: string; finalPrice: number };
  'player.unsold': { auctionId: string; player: IPlayer };
  'auction.started': { auctionId: string };
  'auction.paused': { auctionId: string };
  'auction.completed': { auctionId: string };
  'auction.nextPlayer': { auctionId: string; player: IPlayer };
  'team.created': { team: ITeam };
  'team.updated': { team: ITeam };
  'team.deleted': { teamId: string };
  'team.restored': { team: ITeam };
  'team.retentionAdded': { team: ITeam };
  'team.bulkStatusChanged': { teamIds: string[]; isDeleted: boolean };
  'player.created': { player: IPlayer };
  'player.updated': { player: IPlayer };
  'player.deleted': { playerId: string };
  'player.restored': { player: IPlayer };
  'player.bulkStatusChanged': { playerIds: string[]; isDeleted: boolean };
}

type EventName = keyof DomainEventMap;

class TypedEventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emit<K extends EventName>(event: K, payload: DomainEventMap[K]): void {
    this.emitter.emit(event, payload);
  }

  on<K extends EventName>(event: K, listener: (payload: DomainEventMap[K]) => void): void {
    this.emitter.on(event, listener);
  }

  off<K extends EventName>(event: K, listener: (payload: DomainEventMap[K]) => void): void {
    this.emitter.off(event, listener);
  }
}

export const eventBus = new TypedEventBus();
