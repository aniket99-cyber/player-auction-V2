import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private readonly sockets = new Map<string, Socket>();
  private readonly connectedSignals = new Map<string, ReturnType<typeof signal<boolean>>>();

  connect(namespace: string, token?: string): void {
    const existing = this.sockets.get(namespace);
    if (existing?.connected) {
      return;
    }

    const socket = io(`${environment.socketUrl}${namespace}`, {
      auth: token ? { token } : {},
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const connectedSignal = this.connectedFlag(namespace);
    socket.on('connect', () => connectedSignal.set(true));
    socket.on('disconnect', () => connectedSignal.set(false));

    this.sockets.set(namespace, socket);
  }

  disconnect(namespace: string): void {
    this.sockets.get(namespace)?.disconnect();
    this.sockets.delete(namespace);
    this.connectedFlag(namespace).set(false);
  }

  isConnected(namespace: string) {
    return this.connectedFlag(namespace).asReadonly();
  }

  emit<TPayload>(namespace: string, event: string, payload: TPayload): void {
    this.sockets.get(namespace)?.emit(event, payload);
  }

  on<TPayload>(namespace: string, event: string): Observable<TPayload> {
    return new Observable<TPayload>((subscriber) => {
      const socket = this.sockets.get(namespace);
      if (!socket) {
        subscriber.error(new Error(`Socket namespace "${namespace}" not connected. Call connect() first.`));
        return;
      }

      const handler = (payload: TPayload) => subscriber.next(payload);
      socket.on(event, handler);

      return () => socket.off(event, handler);
    });
  }

  private connectedFlag(namespace: string) {
    let existing = this.connectedSignals.get(namespace);
    if (!existing) {
      existing = signal(false);
      this.connectedSignals.set(namespace, existing);
    }
    return existing;
  }
}
