import { Schema, model, Document, Types } from 'mongoose';
import { idTransformOptions } from '@models/schema-options';

export interface IOwner extends Document {
  _id: Types.ObjectId;
  team: Types.ObjectId;
  name: string;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ownerSchema = new Schema<IOwner>(
  {
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
  },
  { timestamps: true, ...idTransformOptions },
);

export const OwnerModel = model<IOwner>('Owner', ownerSchema);
