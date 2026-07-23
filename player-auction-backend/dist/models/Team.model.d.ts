import { Document, Types } from 'mongoose';
export interface ITeam extends Document {
    _id: Types.ObjectId;
    name: string;
    shortName: string;
    logoUrl?: string;
    owner: Types.ObjectId;
    totalBudget: number;
    remainingBudget: number;
    players: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const TeamModel: import("mongoose").Model<ITeam, {}, {}, {}, Document<unknown, {}, ITeam, {}, import("mongoose").DefaultSchemaOptions> & ITeam & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITeam>;
