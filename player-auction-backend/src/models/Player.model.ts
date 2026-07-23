import { Schema, model, Document, Types, Query } from 'mongoose';
import { PlayerAuctionStatus, PlayerRole } from '@constants/enums';

export interface IPlayer extends Document {
  _id: Types.ObjectId;
  name: string;
  role: PlayerRole;
  country: string;
  age?: number;
  basePrice: number;
  imageUrl?: string;
  stats: {
    matches: number;
    runs?: number;
    wickets?: number;
    average?: number;
    strikeRate?: number;
  };
  auctionStatus: PlayerAuctionStatus;
  isRetained: boolean;
  soldTo?: Types.ObjectId;
  soldPrice?: number;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(PlayerRole), required: true },
    country: { type: String, required: true, trim: true },
    age: { type: Number, min: 14, max: 60 },
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
      enum: Object.values(PlayerAuctionStatus),
      default: PlayerAuctionStatus.PENDING,
    },
    isRetained: { type: Boolean, default: false },
    soldTo: { type: Schema.Types.ObjectId, ref: 'Team' },
    soldPrice: { type: Number },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

playerSchema.index({ auctionStatus: 1 });
playerSchema.index({ role: 1 });
playerSchema.index({ country: 1 });
playerSchema.index({ basePrice: 1 });
playerSchema.index({ isDeleted: 1 });
playerSchema.index({ name: 'text', country: 'text' });

// Soft-delete convention: mirrors Team.model.ts — every normal find is
// scoped to non-deleted rows unless explicitly overridden.
playerSchema.pre(
  /^find/,
  { query: true, document: false },
  function (this: Query<unknown, IPlayer>) {
    if (this.getFilter().isDeleted === undefined && !this.getOptions().includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  },
);

export const PlayerModel = model<IPlayer>('Player', playerSchema);
