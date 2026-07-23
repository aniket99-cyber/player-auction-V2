import { Document, Types } from 'mongoose';
import { PlayerAuctionStatus, PlayerRole } from '@constants/enums';
export interface IPlayer extends Document {
    _id: Types.ObjectId;
    name: string;
    role: PlayerRole;
    country: string;
    basePrice: number;
    imageUrl?: string;
    stats: {
        matches: number;
        runs?: number;
        wickets?: number;
        average?: number;
        strikeRate?: number;
    };
    auctionStatus: PlayerAuctionStatus;
    soldTo?: Types.ObjectId;
    soldPrice?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PlayerModel: import("mongoose").Model<IPlayer, {}, {}, {}, Document<unknown, {}, IPlayer, {}, import("mongoose").DefaultSchemaOptions> & IPlayer & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPlayer>;
