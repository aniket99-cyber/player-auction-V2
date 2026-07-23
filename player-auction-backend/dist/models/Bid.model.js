"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("@constants/enums");
const bidSchema = new mongoose_1.Schema({
    auction: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Auction', required: true },
    player: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Player', required: true },
    team: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(enums_1.BidStatus), default: enums_1.BidStatus.ACTIVE },
    placedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
bidSchema.index({ auction: 1, player: 1, createdAt: -1 });
exports.BidModel = (0, mongoose_1.model)('Bid', bidSchema);
//# sourceMappingURL=Bid.model.js.map