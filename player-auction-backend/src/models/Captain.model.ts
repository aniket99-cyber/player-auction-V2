import { Schema, model, Document, Types } from 'mongoose';
import { idTransformOptions } from '@models/schema-options';

export interface ICaptain extends Document {
  _id: Types.ObjectId;
  team: Types.ObjectId;
  player: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const captainSchema = new Schema<ICaptain>(
  {
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true, unique: true },
    player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  },
  { timestamps: true, ...idTransformOptions },
);

export const CaptainModel = model<ICaptain>('Captain', captainSchema);
