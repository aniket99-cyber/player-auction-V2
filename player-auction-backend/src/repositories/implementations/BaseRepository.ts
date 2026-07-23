import { QueryFilter, Model } from 'mongoose';
import { IRepository, PaginatedResult, PaginationOptions } from '@repositories/interfaces/IRepository';

export abstract class BaseRepository<TDocument, TCreateDto = Partial<TDocument>>
  implements IRepository<TDocument, TCreateDto>
{
  protected constructor(protected readonly model: Model<TDocument>) {}

  async findById(id: string): Promise<TDocument | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: QueryFilter<TDocument>): Promise<TDocument | null> {
    return this.model.findOne(filter).exec();
  }

  async findMany(filter: QueryFilter<TDocument>): Promise<TDocument[]> {
    return this.model.find(filter).exec();
  }

  async findPaginated(
    filter: QueryFilter<TDocument>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<TDocument>> {
    const page = Math.max(1, options.page);
    const limit = Math.max(1, options.limit);
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = options.sortBy
      ? { [options.sortBy]: options.sortOrder === 'desc' ? -1 : 1 }
      : { _id: -1 };

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async create(data: TCreateDto): Promise<TDocument> {
    const created = new this.model(data);
    return (await created.save()) as TDocument;
  }

  async updateById(id: string, data: Partial<TDocument>): Promise<TDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async deleteAll(): Promise<number> {
    const result = await this.model.deleteMany({}).exec();
    return result.deletedCount ?? 0;
  }
}
