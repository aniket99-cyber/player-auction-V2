import { Server } from 'socket.io';
import { eventBus } from '@events/EventBus';
import { logger } from '@utils/logger';
import { AuthenticatedSocket, socketAuthMiddleware } from '@sockets/socket.auth';

const auctionRoom = (auctionId: string): string => `auction:${auctionId}`;

export function registerAuctionGateway(io: Server): void {
  const auctionNamespace = io.of('/auction');
  auctionNamespace.use(socketAuthMiddleware);

  auctionNamespace.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Socket connected', { socketId: socket.id, userId: socket.user?.sub });

    socket.on('auction:join', (auctionId: string) => {
      socket.join(auctionRoom(auctionId));
    });

    socket.on('auction:leave', (auctionId: string) => {
      socket.leave(auctionRoom(auctionId));
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });

  eventBus.on('bid.placed', ({ auctionId, bid }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('bid:placed', bid);
  });

  eventBus.on('player.sold', ({ auctionId, player, teamId, finalPrice }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('player:sold', { player, teamId, finalPrice });
  });

  eventBus.on('player.unsold', ({ auctionId, player }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('player:unsold', { player });
  });

  eventBus.on('auction.nextPlayer', ({ auctionId, player }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:nextPlayer', { player });
  });

  eventBus.on('auction.started', ({ auctionId }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:started');
  });

  eventBus.on('auction.paused', ({ auctionId }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:paused');
  });

  eventBus.on('auction.completed', ({ auctionId }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:completed');
  });
}
