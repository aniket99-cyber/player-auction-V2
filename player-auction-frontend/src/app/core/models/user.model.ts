import { UserRole } from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}
