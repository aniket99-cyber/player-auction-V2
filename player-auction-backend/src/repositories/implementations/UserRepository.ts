import { IUser, UserModel } from '@models/User.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IUserRepository } from '@repositories/interfaces/IUserRepository';

export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string, includeSensitive = false): Promise<IUser | null> {
    const query = this.model.findOne({ email: email.toLowerCase() });
    if (includeSensitive) {
      query.select('+passwordHash +refreshTokenHash');
    }
    return query.exec();
  }
}
