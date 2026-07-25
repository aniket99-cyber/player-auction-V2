import { AuditLogModel, IAuditLog } from '@models/AuditLog.model';
import { IAuditLogRepository } from '@repositories/interfaces/IAuditLogRepository';

export class AuditLogRepository implements IAuditLogRepository {
  async record(entry: {
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }): Promise<IAuditLog> {
    const created = new AuditLogModel(entry);
    return created.save();
  }

  async findByEntity(entityType: string, entityId: string): Promise<IAuditLog[]> {
    return AuditLogModel.find({ entityType, entityId }).sort({ createdAt: -1 }).exec();
  }

  async deleteAll(): Promise<number> {
    const result = await AuditLogModel.deleteMany({}).exec();
    return result.deletedCount ?? 0;
  }
}
