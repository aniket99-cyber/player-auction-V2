import { EventEmitter } from 'node:events';
import type { IPlayer } from '@models/Player.model';
import type { ITeam } from '@models/Team.model';

export interface DomainEventMap {
  'auction.bidBumped': { auctionId: string; amount: number };
  'auction.bidUndone': { auctionId: string; amount: number | null };
  'auction.enteredFinalizing': { auctionId: string; currentBid: { amount: number } | null };
  'player.sold': { auctionId: string; player: IPlayer; teamId: string; finalPrice: number };
  'player.unsold': { auctionId: string; player: IPlayer };
  'player.skipped': { auctionId: string; player: IPlayer };
  'auction.started': { auctionId: string };
  'auction.paused': { auctionId: string };
  'auction.resumed': { auctionId: string };
  'auction.completed': { auctionId: string };
  'auction.playerSelected': { auctionId: string; player: IPlayer; selectionMode: string };
  'auction.teamBudgetUpdated': { auctionId: string; teamId: string; remainingBudget: number };
  'auction.awaitingNextRound': { auctionId: string; round: number; unsoldCount: number };
  'auction.roundStarted': { auctionId: string; round: number };
  'auction.activeChanged': { activeAuctionId: string | null };
  'auction.deleted': { auctionId: string };
  'team.created': { team: ITeam };
  'team.updated': { team: ITeam };
  'team.deleted': { teamId: string };
  'team.restored': { team: ITeam };
  'team.retentionAdded': { team: ITeam };
  'team.bulkStatusChanged': { teamIds: string[]; isDeleted: boolean };
  'team.resetForAuction': { modifiedCount: number };
  'team.resetAll': { modifiedCount: number };
  'player.created': { player: IPlayer };
  'player.updated': { player: IPlayer };
  'player.deleted': { playerId: string };
  'player.restored': { player: IPlayer };
  'player.bulkStatusChanged': { playerIds: string[]; isDeleted: boolean };
  'player.resetForAuction': { modifiedCount: number };
  'player.resetAll': { modifiedCount: number };
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
