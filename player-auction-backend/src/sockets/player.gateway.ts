import { Server } from 'socket.io';
import { eventBus } from '@events/EventBus';
import { logger } from '@utils/logger';
import { AuthenticatedSocket, socketAuthMiddleware } from '@sockets/socket.auth';

export function registerPlayerGateway(io: Server): void {
  const playerNamespace = io.of('/players');
  playerNamespace.use(socketAuthMiddleware);

  playerNamespace.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Player socket connected', { socketId: socket.id, userId: socket.user?.sub });

    socket.on('disconnect', () => {
      logger.info('Player socket disconnected', { socketId: socket.id });
    });
  });

  eventBus.on('player.created', ({ player }) => {
    playerNamespace.emit('player:created', player);
  });

  eventBus.on('player.updated', ({ player }) => {
    playerNamespace.emit('player:updated', player);
  });

  eventBus.on('player.deleted', ({ playerId }) => {
    playerNamespace.emit('player:deleted', { playerId });
  });

  eventBus.on('player.restored', ({ player }) => {
    playerNamespace.emit('player:restored', player);
  });

  eventBus.on('player.bulkStatusChanged', ({ playerIds, isDeleted }) => {
    playerNamespace.emit('player:bulkStatusChanged', { playerIds, isDeleted });
  });
}
