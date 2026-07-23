"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionRepository = void 0;
const Auction_model_1 = require("@models/Auction.model");
const BaseRepository_1 = require("@repositories/implementations/BaseRepository");
class AuctionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Auction_model_1.AuctionModel);
    }
    async setCurrentBid(auctionId, amount, teamId) {
        return this.model
            .findByIdAndUpdate(auctionId, { currentBid: { amount, team: teamId } }, { new: true, runValidators: true })
            .exec();
    }
    async advanceToNextPlayer(auctionId, nextPlayerId) {
        return this.model
            .findByIdAndUpdate(auctionId, { currentPlayer: nextPlayerId, currentBid: undefined }, { new: true })
            .exec();
    }
}
exports.AuctionRepository = AuctionRepository;
//# sourceMappingURL=AuctionRepository.js.map