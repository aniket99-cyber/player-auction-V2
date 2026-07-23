import { Socket } from 'socket.io';
import type { AccessTokenPayload } from '@middleware/auth.middleware';
export interface AuthenticatedSocket extends Socket {
    user?: AccessTokenPayload;
}
export declare function socketAuthMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void): void;
