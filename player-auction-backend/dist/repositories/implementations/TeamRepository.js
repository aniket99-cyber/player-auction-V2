"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRepository = void 0;
const Team_model_1 = require("@models/Team.model");
const BaseRepository_1 = require("@repositories/implementations/BaseRepository");
class TeamRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Team_model_1.TeamModel);
    }
    async deductBudget(teamId, amount) {
        return this.model
            .findOneAndUpdate({ _id: teamId, remainingBudget: { $gte: amount } }, { $inc: { remainingBudget: -amount } }, { new: true, runValidators: true })
            .exec();
    }
    async addPlayer(teamId, playerId) {
        return this.model
            .findByIdAndUpdate(teamId, { $addToSet: { players: playerId } }, { new: true })
            .exec();
    }
}
exports.TeamRepository = TeamRepository;
//# sourceMappingURL=TeamRepository.js.map