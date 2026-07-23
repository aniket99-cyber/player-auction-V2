import { Schema, model, Document, Types, Query } from 'mongoose';
import { idTransformOptions } from '@models/schema-options';

export interface IRetentionEntry {
  player: Types.ObjectId;
  retentionPrice: number;
  retentionOrder: number;
  approvedBy: Types.ObjectId;
  retainedAt: Date;
}

export interface ITeam extends Document {
  _id: Types.ObjectId;
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  owner?: Types.ObjectId;
  captain?: Types.ObjectId;
  totalBudget: number;
  remainingBudget: number;
  players: Types.ObjectId[];
  retentions: IRetentionEntry[];
  season: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

const retentionEntrySchema = new Schema<IRetentionEntry>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    retentionPrice: { type: Number, required: true, min: 0 },
    retentionOrder: { type: Number, required: true, min: 1 },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    retainedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, uppercase: true, trim: true, maxlength: 5 },
    logoUrl: { type: String },
    primaryColor: {
      type: String,
      required: true,
      default: '#2fd0ff',
      validate: {
        validator: (v: string) => HEX_COLOR_PATTERN.test(v),
        message: 'primaryColor must be a valid hex color (e.g. #2fd0ff)',
      },
    },
    secondaryColor: {
      type: String,
      required: true,
      default: '#0b0e14',
      validate: {
        validator: (v: string) => HEX_COLOR_PATTERN.test(v),
        message: 'secondaryColor must be a valid hex color (e.g. #0b0e14)',
      },
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    captain: { type: Schema.Types.ObjectId, ref: 'Player' },
    totalBudget: { type: Number, required: true, min: 0 },
    remainingBudget: { type: Number, required: true, min: 0 },
    players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    retentions: [retentionEntrySchema],
    season: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, ...idTransformOptions },
);

// Unique per season, not globally — the same franchise name can recur next season
teamSchema.index({ name: 1, season: 1 }, { unique: true });
teamSchema.index({ isDeleted: 1 });
teamSchema.index({ owner: 1 });
teamSchema.index({ season: 1 });

// Soft-delete convention: every normal find goes through this default filter
// unless explicitly overridden with { includeDeleted: true } at the repository layer.
teamSchema.pre(
  /^find/,
  { query: true, document: false },
  function (this: Query<unknown, ITeam>) {
    if (this.getFilter().isDeleted === undefined && !this.getOptions().includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  },
);

export const TeamModel = model<ITeam>('Team', teamSchema);
