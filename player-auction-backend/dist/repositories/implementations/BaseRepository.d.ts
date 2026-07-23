import { QueryFilter, Model } from 'mongoose';
import { IRepository } from '@repositories/interfaces/IRepository';
export declare abstract class BaseRepository<TDocument, TCreateDto = Partial<TDocument>> implements IRepository<TDocument, TCreateDto> {
    protected readonly model: Model<TDocument>;
    protected constructor(model: Model<TDocument>);
    findById(id: string): Promise<TDocument | null>;
    findOne(filter: QueryFilter<TDocument>): Promise<TDocument | null>;
    findMany(filter: QueryFilter<TDocument>): Promise<TDocument[]>;
    create(data: TCreateDto): Promise<TDocument>;
    updateById(id: string, data: Partial<TDocument>): Promise<TDocument | null>;
    deleteById(id: string): Promise<boolean>;
}
