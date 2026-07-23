"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamModel = void 0;
const mongoose_1 = require("mongoose");
const teamSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    shortName: { type: String, required: true, uppercase: true, maxlength: 5 },
    logoUrl: { type: String },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    totalBudget: { type: Number, required: true, min: 0 },
    remainingBudget: { type: Number, required: true, min: 0 },
    players: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' }],
}, { timestamps: true });
exports.TeamModel = (0, mongoose_1.model)('Team', teamSchema);
//# sourceMappingURL=Team.model.js.map