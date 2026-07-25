import { QueryFilter } from 'mongoose';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<TDocument> {
  data: TDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IRepository<TDocument, TCreateDto = Partial<TDocument>> {
  findById(id: string): Promise<TDocument | null>;
  findOne(filter: QueryFilter<TDocument>): Promise<TDocument | null>;
  findMany(filter: QueryFilter<TDocument>): Promise<TDocument[]>;
  findPaginated(
    filter: QueryFilter<TDocument>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<TDocument>>;
  create(data: TCreateDto): Promise<TDocument>;
  updateById(id: string, data: Partial<TDocument>): Promise<TDocument | null>;
  deleteById(id: string): Promise<boolean>;
  /** Wipes every document in the collection. Returns the number deleted. */
  deleteAll(): Promise<number>;
}
