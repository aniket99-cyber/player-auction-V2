import { IUser } from '@models/User.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IUserRepository } from '@repositories/interfaces/IUserRepository';
export declare class UserRepository extends BaseRepository<IUser> implements IUserRepository {
    constructor();
    findByEmail(email: string, includeSensitive?: boolean): Promise<IUser | null>;
}
