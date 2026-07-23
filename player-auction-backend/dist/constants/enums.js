"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidStatus = exports.PlayerRole = exports.PlayerAuctionStatus = exports.AuctionStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["TEAM_MANAGER"] = "TEAM_MANAGER";
    UserRole["VIEWER"] = "VIEWER";
})(UserRole || (exports.UserRole = UserRole = {}));
var AuctionStatus;
(function (AuctionStatus) {
    AuctionStatus["DRAFT"] = "DRAFT";
    AuctionStatus["SCHEDULED"] = "SCHEDULED";
    AuctionStatus["LIVE"] = "LIVE";
    AuctionStatus["PAUSED"] = "PAUSED";
    AuctionStatus["COMPLETED"] = "COMPLETED";
    AuctionStatus["CANCELLED"] = "CANCELLED";
})(AuctionStatus || (exports.AuctionStatus = AuctionStatus = {}));
var PlayerAuctionStatus;
(function (PlayerAuctionStatus) {
    PlayerAuctionStatus["UNSOLD"] = "UNSOLD";
    PlayerAuctionStatus["SOLD"] = "SOLD";
    PlayerAuctionStatus["PENDING"] = "PENDING";
    PlayerAuctionStatus["IN_BIDDING"] = "IN_BIDDING";
})(PlayerAuctionStatus || (exports.PlayerAuctionStatus = PlayerAuctionStatus = {}));
var PlayerRole;
(function (PlayerRole) {
    PlayerRole["BATSMAN"] = "BATSMAN";
    PlayerRole["BOWLER"] = "BOWLER";
    PlayerRole["ALL_ROUNDER"] = "ALL_ROUNDER";
    PlayerRole["WICKET_KEEPER"] = "WICKET_KEEPER";
})(PlayerRole || (exports.PlayerRole = PlayerRole = {}));
var BidStatus;
(function (BidStatus) {
    BidStatus["ACTIVE"] = "ACTIVE";
    BidStatus["OUTBID"] = "OUTBID";
    BidStatus["WINNING"] = "WINNING";
    BidStatus["REJECTED"] = "REJECTED";
})(BidStatus || (exports.BidStatus = BidStatus = {}));
//# sourceMappingURL=enums.js.map