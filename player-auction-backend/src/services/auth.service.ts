import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { ApiError } from '@utils/ApiError';
import { UserRole } from '@constants/enums';
import { IUserRepository } from '@repositories/interfaces/IUserRepository';
import { IUser } from '@models/User.model';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult extends AuthTokens {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

const SALT_ROUNDS = 12;

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: UserRole.VIEWER,
    });

    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(input.email, true);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshToken, env.jwt.refreshSecret) as { sub: string };
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw ApiError.unauthorized('Session no longer valid');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw ApiError.unauthorized('Session no longer valid');
    }

    return this.generateAndPersistTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.updateById(userId, { refreshTokenHash: undefined });
  }

  private async issueSession(user: IUser): Promise<AuthResult> {
    const tokens = await this.generateAndPersistTokens(user);
    return {
      ...tokens,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    };
  }

  private async generateAndPersistTokens(user: IUser): Promise<AuthTokens> {
    const userId = user._id.toString();
    const accessToken = jwt.sign(
      { sub: userId, role: user.role, team: user.team?.toString() },
      env.jwt.accessSecret,
      { expiresIn: env.jwt.accessExpiry } as jwt.SignOptions,
    );

    const refreshToken = jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiry,
    } as jwt.SignOptions);

    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.userRepository.updateById(userId, { refreshTokenHash });

    return { accessToken, refreshToken };
  }
}
