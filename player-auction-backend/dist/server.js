"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const env_1 = require("@config/env");
const database_1 = require("@config/database");
const logger_1 = require("@utils/logger");
const auction_gateway_1 = require("@sockets/auction.gateway");
async function bootstrap() {
    await (0, database_1.connectDatabase)();
    const app = (0, app_1.createApp)();
    const httpServer = (0, node_http_1.createServer)(app);
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.corsOrigin,
            credentials: true,
        },
    });
    (0, auction_gateway_1.registerAuctionGateway)(io);
    httpServer.listen(env_1.env.port, () => {
        logger_1.logger.info(`Server listening on port ${env_1.env.port} [${env_1.env.nodeEnv}]`);
    });
    const shutdown = (signal) => {
        logger_1.logger.info(`Received ${signal}, shutting down gracefully`);
        httpServer.close(() => process.exit(0));
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
bootstrap().catch((err) => {
    logger_1.logger.error('Failed to bootstrap application', { message: err.message, stack: err.stack });
    process.exit(1);
});
//# sourceMappingURL=server.js.map