import { Schema, model, Document, Types } from 'mongoose';
import { idTransformOptions } from '@models/schema-options';
import { BidStatus } from '@constants/enums';

export interface IBid extends Document {
  _id: Types.ObjectId;
  auction: Types.ObjectId;
  player: Types.ObjectId;
  team: Types.ObjectId;
  amount: number;
  status: BidStatus;
  placedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new Schema<IBid>(
  {
    auction: { type: Schema.Types.ObjectId, ref: 'Auction', required: true },
    player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(BidStatus), default: BidStatus.ACTIVE },
    placedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, ...idTransformOptions },
);

bidSchema.index({ auction: 1, player: 1, createdAt: -1 });

export const BidModel = model<IBid>('Bid', bidSchema);
