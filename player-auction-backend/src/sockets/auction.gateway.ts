import { Server } from 'socket.io';
import { eventBus } from '@events/EventBus';
import { logger } from '@utils/logger';
import { AuthenticatedSocket, optionalSocketAuthMiddleware } from '@sockets/socket.auth';
import { auctionService } from '@routes/auction.routes';
import { UserRole } from '@constants/enums';
import { ApiError } from '@utils/ApiError';

const auctionRoom = (auctionId: string): string => `auction:${auctionId}`;

export function registerAuctionGateway(io: Server): void {
  const auctionNamespace = io.of('/auction');
  auctionNamespace.use(optionalSocketAuthMiddleware);

  auctionNamespace.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Socket connected', { socketId: socket.id, userId: socket.user?.sub });

    socket.on('auction:join', (auctionId: string) => {
      socket.join(auctionRoom(auctionId));
    });

    socket.on('auction:leave', (auctionId: string) => {
      socket.leave(auctionRoom(auctionId));
    });

    // Admin-only: bumps the running bid counter by one tier increment. No
    // team is attached — every team bids verbally in the room, and a team
    // is only chosen once, at confirm-sale time.
    socket.on('bid:bump', async (auctionId: string) => {
      try {
        if (!socket.user) throw ApiError.unauthorized();
        await auctionService.bumpBid(auctionId, socket.user.sub, socket.user.role);
      } catch (err) {
        socket.emit('bid:rejected', {
          message: err instanceof ApiError ? err.message : 'Failed to increase the bid',
        });
      }
    });

    socket.on('bid:undo', async (auctionId: string) => {
      try {
        if (!socket.user || socket.user.role !== UserRole.ADMIN) {
          throw ApiError.forbidden('Only admins can undo a bid');
        }
        await auctionService.undoBump(auctionId, socket.user.sub);
      } catch (err) {
        socket.emit('bid:undoRejected', {
          message: err instanceof ApiError ? err.message : 'Failed to undo bid',
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });

  eventBus.on('auction.bidBumped', ({ auctionId, amount }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('bid:bumped', { amount });
  });

  eventBus.on('auction.bidUndone', ({ auctionId, amount }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('bid:undone', { amount });
  });

  eventBus.on('auction.enteredFinalizing', ({ auctionId, currentBid }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:enteredFinalizing', { currentBid });
  });

  eventBus.on('player.sold', ({ auctionId, player, teamId, finalPrice }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('player:sold', { player, teamId, finalPrice });
  });

  eventBus.on('player.unsold', ({ auctionId, player }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('player:unsold', { player });
  });

  eventBus.on('player.skipped', ({ auctionId, player }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('player:skipped', { player });
  });

  eventBus.on('auction.playerSelected', ({ auctionId, player, selectionMode }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:playerSelected', { player, selectionMode });
  });

  eventBus.on('auction.teamBudgetUpdated', ({ auctionId, teamId, remainingBudget }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:teamBudgetUpdated', {
      teamId,
      remainingBudget,
    });
  });

  eventBus.on('auction.started', ({ auctionId }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:started');
  });

  eventBus.on('auction.paused', ({ auctionId }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:paused');
  });

  eventBus.on('auction.resumed', ({ auctionId }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:resumed');
  });

  eventBus.on('auction.completed', ({ auctionId }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:completed');
  });

  eventBus.on('auction.awaitingNextRound', ({ auctionId, round, unsoldCount }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:awaitingNextRound', { round, unsoldCount });
  });

  eventBus.on('auction.roundStarted', ({ auctionId, round }) => {
    auctionNamespace.to(auctionRoom(auctionId)).emit('auction:roundStarted', { round });
  });

  eventBus.on('auction.activeChanged', ({ activeAuctionId }) => {
    auctionNamespace.emit('auction:activeChanged', { activeAuctionId });
  });

  eventBus.on('auction.deleted', ({ auctionId }) => {
    auctionNamespace.emit('auction:deleted', { auctionId });
  });
}
