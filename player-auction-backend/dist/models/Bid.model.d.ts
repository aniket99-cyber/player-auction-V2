import { Document, Types } from 'mongoose';
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
export declare const BidModel: import("mongoose").Model<IBid, {}, {}, {}, Document<unknown, {}, IBid, {}, import("mongoose").DefaultSchemaOptions> & IBid & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBid>;
