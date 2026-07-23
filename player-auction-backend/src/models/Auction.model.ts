import { Schema, model, Document, Types } from 'mongoose';
import { AuctionStatus } from '@constants/enums';

export interface IAuction extends Document {
  _id: Types.ObjectId;
  name: string;
  status: AuctionStatus;
  playerQueue: Types.ObjectId[];
  currentPlayer?: Types.ObjectId;
  currentBid?: {
    amount: number;
    team: Types.ObjectId;
  };
  bidIncrementRules: Array<{ upTo: number; increment: number }>;
  participatingTeams: Types.ObjectId[];
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
    currentBid: {
      amount: { type: Number },
      team: { type: Schema.Types.ObjectId, ref: 'Team' },
    },
    bidIncrementRules: [
      {
        upTo: { type: Number, required: true },
        increment: { type: Number, required: true },
      },
    ],
    participatingTeams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

auctionSchema.index({ status: 1 });

export const AuctionModel = model<IAuction>('Auction', auctionSchema);
