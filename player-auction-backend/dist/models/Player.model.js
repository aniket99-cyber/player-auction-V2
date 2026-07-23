"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("@constants/enums");
const playerSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(enums_1.PlayerRole), required: true },
    country: { type: String, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    stats: {
        matches: { type: Number, default: 0 },
        runs: { type: Number },
        wickets: { type: Number },
        average: { type: Number },
        strikeRate: { type: Number },
    },
    auctionStatus: {
        type: String,
        enum: Object.values(enums_1.PlayerAuctionStatus),
        default: enums_1.PlayerAuctionStatus.PENDING,
    },
    soldTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' },
    soldPrice: { type: Number },
}, { timestamps: true });
playerSchema.index({ auctionStatus: 1 });
playerSchema.index({ role: 1 });
exports.PlayerModel = (0, mongoose_1.model)('Player', playerSchema);
//# sourceMappingURL=Player.model.js.map