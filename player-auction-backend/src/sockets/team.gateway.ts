import { Server } from 'socket.io';
import { eventBus } from '@events/EventBus';
import { logger } from '@utils/logger';
import { AuthenticatedSocket, socketAuthMiddleware } from '@sockets/socket.auth';

export function registerTeamGateway(io: Server): void {
  const teamNamespace = io.of('/teams');
  teamNamespace.use(socketAuthMiddleware);

  teamNamespace.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Team socket connected', { socketId: socket.id, userId: socket.user?.sub });

    socket.on('disconnect', () => {
      logger.info('Team socket disconnected', { socketId: socket.id });
    });
  });

  eventBus.on('team.created', ({ team }) => {
    teamNamespace.emit('team:created', team);
  });

  eventBus.on('team.updated', ({ team }) => {
    teamNamespace.emit('team:updated', team);
  });

  eventBus.on('team.deleted', ({ teamId }) => {
    teamNamespace.emit('team:deleted', { teamId });
  });

  eventBus.on('team.restored', ({ team }) => {
    teamNamespace.emit('team:restored', team);
  });

  eventBus.on('team.retentionAdded', ({ team }) => {
    teamNamespace.emit('team:retentionAdded', team);
  });

  eventBus.on('team.bulkStatusChanged', ({ teamIds, isDeleted }) => {
    teamNamespace.emit('team:bulkStatusChanged', { teamIds, isDeleted });
  });
}
