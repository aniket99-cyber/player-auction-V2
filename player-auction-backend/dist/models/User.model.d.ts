import { Document, Types } from 'mongoose';
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
export declare const UserModel: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
