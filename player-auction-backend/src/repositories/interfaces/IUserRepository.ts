import { IUser } from '@models/User.model';
import { IRepository } from '@repositories/interfaces/IRepository';

export interface IUserRepository extends IRepository<IUser> {
  findByEmail(email: string, includeSensitive?: boolean): Promise<IUser | null>;
}
