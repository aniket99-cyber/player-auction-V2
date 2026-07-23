"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerRepository = void 0;
const Player_model_1 = require("@models/Player.model");
const enums_1 = require("@constants/enums");
const BaseRepository_1 = require("@repositories/implementations/BaseRepository");
class PlayerRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Player_model_1.PlayerModel);
    }
    async findByAuctionStatus(status) {
        return this.model.find({ auctionStatus: status }).exec();
    }
    async markSold(playerId, teamId, finalPrice) {
        return this.model
            .findByIdAndUpdate(playerId, {
            auctionStatus: enums_1.PlayerAuctionStatus.SOLD,
            soldTo: teamId,
            soldPrice: finalPrice,
        }, { new: true, runValidators: true })
            .exec();
    }
    async markUnsold(playerId) {
        return this.model
            .findByIdAndUpdate(playerId, { auctionStatus: enums_1.PlayerAuctionStatus.UNSOLD }, { new: true })
            .exec();
    }
}
exports.PlayerRepository = PlayerRepository;
//# sourceMappingURL=PlayerRepository.js.map