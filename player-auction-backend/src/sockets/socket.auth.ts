import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import type { AccessTokenPayload } from '@middleware/auth.middleware';

export interface AuthenticatedSocket extends Socket {
  user?: AccessTokenPayload;
}

export function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
): void {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    next(new Error('Authentication token missing'));
    return;
  }

  try {
    socket.user = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}
