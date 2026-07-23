import { Schema, model, Document, Types } from 'mongoose';
import { idTransformOptions } from '@models/schema-options';

export interface IBidIncrementRule {
  upTo: number;
  increment: number;
}

// This collection only ever holds one document — there is no natural key
// to pick, so the repository always queries/upserts via an empty filter
// rather than a well-known ID (avoids fighting Mongoose's default
// ObjectId-typed `_id`, which every other model in this app also relies on
// via the shared `idTransformOptions` typing).
export interface ISettings extends Document {
  _id: Types.ObjectId;
  defaultTeamBudget: number;
  defaultBidIncrementRules: IBidIncrementRule[];
  createdAt: Date;
  updatedAt: Date;
}

const bidIncrementRuleSchema = new Schema<IBidIncrementRule>(
  {
    upTo: { type: Number, required: true, min: 0 },
    increment: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const settingsSchema = new Schema<ISettings>(
  {
    defaultTeamBudget: { type: Number, required: true, min: 0, default: 1000 },
    defaultBidIncrementRules: {
      type: [bidIncrementRuleSchema],
      required: true,
      default: [
        { upTo: 100, increment: 5 },
        { upTo: 500, increment: 10 },
        { upTo: 1000, increment: 25 },
      ],
    },
  },
  { timestamps: true, ...idTransformOptions },
);

export const SettingsModel = model<ISettings>('Settings', settingsSchema);
