import { Schema, model, Document, Types } from 'mongoose';
import { idTransformOptions } from '@models/schema-options';
import { UserRole } from '@constants/enums';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  team?: Types.ObjectId;
  isActive: boolean;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.VIEWER },
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true, ...idTransformOptions },
);

export const UserModel = model<IUser>('User', userSchema);
