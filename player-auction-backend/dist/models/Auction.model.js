"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("@constants/enums");
const auctionSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(enums_1.AuctionStatus), default: enums_1.AuctionStatus.DRAFT },
    playerQueue: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' }],
    currentPlayer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' },
    currentBid: {
        amount: { type: Number },
        team: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' },
    },
    bidIncrementRules: [
        {
            upTo: { type: Number, required: true },
            increment: { type: Number, required: true },
        },
    ],
    participatingTeams: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
}, { timestamps: true });
auctionSchema.index({ status: 1 });
exports.AuctionModel = (0, mongoose_1.model)('Auction', auctionSchema);
//# sourceMappingURL=Auction.model.js.map