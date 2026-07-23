import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { env } from '@config/env';
import { connectDatabase } from '@config/database';
import { logger } from '@utils/logger';
import { registerAuctionGateway } from '@sockets/auction.gateway';
import { registerTeamGateway } from '@sockets/team.gateway';
import { registerPlayerGateway } from '@sockets/player.gateway';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
  });

  registerAuctionGateway(io);
  registerTeamGateway(io);
  registerPlayerGateway(io);

  httpServer.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    httpServer.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to bootstrap application', { message: err.message, stack: err.stack });
  process.exit(1);
});
