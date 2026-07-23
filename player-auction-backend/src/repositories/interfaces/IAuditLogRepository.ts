import { IAuditLog } from '@models/AuditLog.model';

export interface IAuditLogRepository {
  record(entry: {
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }): Promise<IAuditLog>;

  findByEntity(entityType: string, entityId: string): Promise<IAuditLog[]>;
  deleteAll(): Promise<number>;
}
