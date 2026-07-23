import { QueryFilter } from 'mongoose';
export interface IRepository<TDocument, TCreateDto = Partial<TDocument>> {
    findById(id: string): Promise<TDocument | null>;
    findOne(filter: QueryFilter<TDocument>): Promise<TDocument | null>;
    findMany(filter: QueryFilter<TDocument>): Promise<TDocument[]>;
    create(data: TCreateDto): Promise<TDocument>;
    updateById(id: string, data: Partial<TDocument>): Promise<TDocument | null>;
    deleteById(id: string): Promise<boolean>;
}
