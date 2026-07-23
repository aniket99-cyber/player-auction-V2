import { Schema, model, Document, Types } from 'mongoose';
import { idTransformOptions } from '@models/schema-options';
import { AuctionPlayerState, AuctionSelectionMode, AuctionStatus } from '@constants/enums';

export interface IAuction extends Document {
  _id: Types.ObjectId;
  name: string;
  status: AuctionStatus;
  playerQueue: Types.ObjectId[];
  currentPlayer?: Types.ObjectId;
  playerState?: AuctionPlayerState;
  // No team is attached to the running bid counter — only the admin bumps
  // it (verbally calling bids in the room); a team is chosen only once, at
  // Finalize. `previousBidAmount` is a single-level undo slot restored by
  // undoBump().
  currentBid?: {
    amount: number;
  };
  previousBidAmount?: number;
  bidIncrementRules: Array<{ upTo: number; increment: number }>;
  participatingTeams: Types.ObjectId[];
  selectionMode: AuctionSelectionMode;
  settings: {
    autoAdvance: boolean;
  };
  round: number;
  unsoldThisRound: Types.ObjectId[];
  createdBy: Types.ObjectId;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const auctionSchema = new Schema<IAuction>(
  {
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(AuctionStatus), default: AuctionStatus.DRAFT },
    playerQueue: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    currentPlayer: { type: Schema.Types.ObjectId, ref: 'Player' },
    playerState: { type: String, enum: Object.values(AuctionPlayerState) },
    currentBid: {
      amount: { type: Number },
    },
    previousBidAmount: { type: Number },
    bidIncrementRules: [
      {
        upTo: { type: Number, required: true },
        increment: { type: Number, required: true },
      },
    ],
    participatingTeams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    selectionMode: {
      type: String,
      enum: Object.values(AuctionSelectionMode),
      default: AuctionSelectionMode.SEQUENTIAL,
    },
    settings: {
      autoAdvance: { type: Boolean, default: true },
    },
    round: { type: Number, default: 1, min: 1 },
    unsoldThisRound: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true, ...idTransformOptions },
);

auctionSchema.index({ status: 1 });

export const AuctionModel = model<IAuction>('Auction', auctionSchema);
