import { UserRole } from '@constants/enums';
import { IUserRepository } from '@repositories/interfaces/IUserRepository';
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
export declare class AuthService {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    register(input: RegisterInput): Promise<AuthResult>;
    login(input: LoginInput): Promise<AuthResult>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    logout(userId: string): Promise<void>;
    private issueSession;
    private generateAndPersistTokens;
}
export {};
