import type { IBid } from '@models/Bid.model';
import type { IPlayer } from '@models/Player.model';
export interface DomainEventMap {
    'bid.placed': {
        auctionId: string;
        bid: IBid;
    };
    'player.sold': {
        auctionId: string;
        player: IPlayer;
        teamId: string;
        finalPrice: number;
    };
    'player.unsold': {
        auctionId: string;
        player: IPlayer;
    };
    'auction.started': {
        auctionId: string;
    };
    'auction.paused': {
        auctionId: string;
    };
    'auction.completed': {
        auctionId: string;
    };
    'auction.nextPlayer': {
        auctionId: string;
        player: IPlayer;
    };
}
type EventName = keyof DomainEventMap;
declare class TypedEventBus {
    private readonly emitter;
    constructor();
    emit<K extends EventName>(event: K, payload: DomainEventMap[K]): void;
    on<K extends EventName>(event: K, listener: (payload: DomainEventMap[K]) => void): void;
    off<K extends EventName>(event: K, listener: (payload: DomainEventMap[K]) => void): void;
}
export declare const eventBus: TypedEventBus;
export {};
