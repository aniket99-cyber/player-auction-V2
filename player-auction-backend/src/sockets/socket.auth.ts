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

/**
 * For namespaces that must admit anonymous read-only clients (the public
 * Live Viewer) alongside authenticated admins/team managers. A present
 * token is still verified and rejected if invalid/expired — only a
 * *missing* token is allowed through, as an anonymous viewer with
 * `socket.user` left undefined. Every write-capable event handler in that
 * namespace must still explicitly check `socket.user` before acting;
 * this middleware only controls whether the connection itself is admitted.
 */
export function optionalSocketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
): void {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    next();
    return;
  }

  try {
    socket.user = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}
