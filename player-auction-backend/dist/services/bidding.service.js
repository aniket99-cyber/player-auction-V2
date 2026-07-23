"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiddingService = void 0;
const ApiError_1 = require("@utils/ApiError");
const EventBus_1 = require("@events/EventBus");
const enums_1 = require("@constants/enums");
const MIN_INCREMENT = 5;
class BiddingService {
    auctionRepository;
    bidRepository;
    teamRepository;
    constructor(auctionRepository, bidRepository, teamRepository) {
        this.auctionRepository = auctionRepository;
        this.bidRepository = bidRepository;
        this.teamRepository = teamRepository;
    }
    async placeBid(input) {
        const auction = await this.auctionRepository.findById(input.auctionId);
        if (!auction) {
            throw ApiError_1.ApiError.notFound('Auction not found');
        }
        if (!auction.currentPlayer || auction.currentPlayer.toString() !== input.playerId) {
            throw ApiError_1.ApiError.badRequest('This player is not currently up for bidding');
        }
        const currentAmount = auction.currentBid?.amount ?? 0;
        if (input.amount < currentAmount + MIN_INCREMENT) {
            throw ApiError_1.ApiError.badRequest(`Bid must be at least ${currentAmount + MIN_INCREMENT}`);
        }
        const team = await this.teamRepository.findById(input.teamId);
        if (!team || team.remainingBudget < input.amount) {
            throw ApiError_1.ApiError.badRequest('Insufficient team budget for this bid');
        }
        const bid = await this.bidRepository.create({
            auction: input.auctionId,
            player: input.playerId,
            team: input.teamId,
            amount: input.amount,
            status: enums_1.BidStatus.WINNING,
            placedBy: input.placedBy,
        });
        await this.auctionRepository.setCurrentBid(input.auctionId, input.amount, input.teamId);
        EventBus_1.eventBus.emit('bid.placed', { auctionId: input.auctionId, bid });
    }
}
exports.BiddingService = BiddingService;
//# sourceMappingURL=bidding.service.js.map