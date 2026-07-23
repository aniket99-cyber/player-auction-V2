"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuctionGateway = registerAuctionGateway;
const EventBus_1 = require("@events/EventBus");
const logger_1 = require("@utils/logger");
const socket_auth_1 = require("@sockets/socket.auth");
const auctionRoom = (auctionId) => `auction:${auctionId}`;
function registerAuctionGateway(io) {
    const auctionNamespace = io.of('/auction');
    auctionNamespace.use(socket_auth_1.socketAuthMiddleware);
    auctionNamespace.on('connection', (socket) => {
        logger_1.logger.info('Socket connected', { socketId: socket.id, userId: socket.user?.sub });
        socket.on('auction:join', (auctionId) => {
            socket.join(auctionRoom(auctionId));
        });
        socket.on('auction:leave', (auctionId) => {
            socket.leave(auctionRoom(auctionId));
        });
        socket.on('disconnect', () => {
            logger_1.logger.info('Socket disconnected', { socketId: socket.id });
        });
    });
    EventBus_1.eventBus.on('bid.placed', ({ auctionId, bid }) => {
        auctionNamespace.to(auctionRoom(auctionId)).emit('bid:placed', bid);
    });
    EventBus_1.eventBus.on('player.sold', ({ auctionId, player, teamId, finalPrice }) => {
        auctionNamespace.to(auctionRoom(auctionId)).emit('player:sold', { player, teamId, finalPrice });
    });
    EventBus_1.eventBus.on('player.unsold', ({ auctionId, player }) => {
        auctionNamespace.to(auctionRoom(auctionId)).emit('player:unsold', { player });
    });
    EventBus_1.eventBus.on('auction.nextPlayer', ({ auctionId, player }) => {
        auctionNamespace.to(auctionRoom(auctionId)).emit('auction:nextPlayer', { player });
    });
    EventBus_1.eventBus.on('auction.started', ({ auctionId }) => {
        auctionNamespace.to(auctionRoom(auctionId)).emit('auction:started');
    });
    EventBus_1.eventBus.on('auction.paused', ({ auctionId }) => {
        auctionNamespace.to(auctionRoom(auctionId)).emit('auction:paused');
    });
    EventBus_1.eventBus.on('auction.completed', ({ auctionId }) => {
        auctionNamespace.to(auctionRoom(auctionId)).emit('auction:completed');
    });
}
//# sourceMappingURL=auction.gateway.js.map