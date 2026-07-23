"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidRepository = void 0;
const Bid_model_1 = require("@models/Bid.model");
const BaseRepository_1 = require("@repositories/implementations/BaseRepository");
class BidRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Bid_model_1.BidModel);
    }
    async findByAuctionAndPlayer(auctionId, playerId) {
        return this.model
            .find({ auction: auctionId, player: playerId })
            .sort({ amount: -1 })
            .exec();
    }
    async findHighestBid(auctionId, playerId) {
        return this.model
            .findOne({ auction: auctionId, player: playerId })
            .sort({ amount: -1 })
            .exec();
    }
}
exports.BidRepository = BidRepository;
//# sourceMappingURL=BidRepository.js.map