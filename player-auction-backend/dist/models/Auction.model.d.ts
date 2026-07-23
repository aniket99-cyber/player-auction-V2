import { Document, Types } from 'mongoose';
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
    bidIncrementRules: Array<{
        upTo: number;
        increment: number;
    }>;
    participatingTeams: Types.ObjectId[];
    createdBy: Types.ObjectId;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AuctionModel: import("mongoose").Model<IAuction, {}, {}, {}, Document<unknown, {}, IAuction, {}, import("mongoose").DefaultSchemaOptions> & IAuction & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAuction>;
