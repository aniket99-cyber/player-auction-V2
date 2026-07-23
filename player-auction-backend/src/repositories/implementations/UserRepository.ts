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

  // User accounts must survive a session reset — override the inherited
  // bulk-wipe to make that guarantee hold even if future code calls it here
  // by mistake.
  override async deleteAll(): Promise<number> {
    throw new Error('deleteAll is disabled for UserRepository — user accounts must never be bulk-deleted');
  }
}
