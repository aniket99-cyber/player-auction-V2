import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { ApiError } from '@utils/ApiError';
import { eventBus } from '@events/EventBus';
import { IPlayer, PlayerModel } from '@models/Player.model';
import { PlayerAuctionStatus, PlayerRole } from '@constants/enums';
import { IAuditLogRepository } from '@repositories/interfaces/IAuditLogRepository';

interface ImportRow {
  rowNumber: number;
  name: string;
  role: PlayerRole;
  country: string;
  basePrice: number;
  age?: number;
  matches?: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
}

interface RowError {
  rowNumber: number;
  errors: string[];
}

const REQUIRED_COLUMNS = ['name', 'role', 'country', 'basePrice'] as const;
const VALID_ROLES = new Set(Object.values(PlayerRole));

export class PlayerImportService {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async importFromCsv(buffer: Buffer, actorId: string): Promise<{ imported: number; players: IPlayer[] }> {
    const records: Record<string, string>[] = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return this.importRecords(records, actorId);
  }

  async importFromExcel(
    buffer: Buffer,
    actorId: string,
  ): Promise<{ imported: number; players: IPlayer[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw ApiError.badRequest('Excel file has no worksheets');
    }

    const headerRow = worksheet.getRow(1).values as unknown[];
    const headers = headerRow.slice(1).map((h) => String(h ?? '').trim());

    const records: Record<string, string>[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = row.values as unknown[];
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = String(values[index + 1] ?? '').trim();
      });
      records.push(record);
    });

    return this.importRecords(records, actorId);
  }

  private async importRecords(
    records: Record<string, string>[],
    actorId: string,
  ): Promise<{ imported: number; players: IPlayer[] }> {
    if (records.length === 0) {
      throw ApiError.badRequest('Import file contains no data rows');
    }

    const { rows, errors } = this.parseAndValidateRows(records);

    if (errors.length > 0) {
      throw ApiError.badRequest('Import rejected — fix the errors below and re-upload', errors);
    }

    const documents = rows.map((row) => ({
      name: row.name,
      role: row.role,
      country: row.country,
      age: row.age,
      basePrice: row.basePrice,
      auctionStatus: PlayerAuctionStatus.PENDING,
      isRetained: false,
      stats: {
        matches: row.matches ?? 0,
        runs: row.runs,
        wickets: row.wickets,
        average: row.average,
        strikeRate: row.strikeRate,
      },
    }));

    // insertMany with ordered:true — every row already passed validation above,
    // so this is the "insert all" half of validate-all-then-insert-all.
    const created = await PlayerModel.insertMany(documents, { ordered: true });
    const players = created as unknown as IPlayer[];

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'player.bulkImported',
      entityType: 'Player',
      entityId: 'bulk',
      after: { count: players.length, names: players.map((p) => p.name) },
    });

    players.forEach((player) => eventBus.emit('player.created', { player }));

    return { imported: players.length, players };
  }

  private parseAndValidateRows(records: Record<string, string>[]): {
    rows: ImportRow[];
    errors: RowError[];
  } {
    const rows: ImportRow[] = [];
    const errors: RowError[] = [];

    records.forEach((record, index) => {
      const rowNumber = index + 2;
      const rowErrors: string[] = [];

      for (const column of REQUIRED_COLUMNS) {
        if (!record[column] || record[column].trim() === '') {
          rowErrors.push(`Missing required column "${column}"`);
        }
      }

      const role = record.role?.trim().toUpperCase();
      if (record.role && !VALID_ROLES.has(role as PlayerRole)) {
        rowErrors.push(
          `role must be one of ${Array.from(VALID_ROLES).join(', ')}, got "${record.role}"`,
        );
      }

      const basePrice = Number(record.basePrice);
      if (record.basePrice && (Number.isNaN(basePrice) || basePrice < 0)) {
        rowErrors.push(`basePrice must be a non-negative number, got "${record.basePrice}"`);
      }

      const age = record.age ? Number(record.age) : undefined;
      if (record.age && (Number.isNaN(age) || (age as number) < 14 || (age as number) > 60)) {
        rowErrors.push(`age must be between 14 and 60, got "${record.age}"`);
      }

      const numericFields: Array<keyof ImportRow> = ['matches', 'runs', 'wickets', 'average', 'strikeRate'];
      const numericValues: Partial<Record<string, number>> = {};
      for (const field of numericFields) {
        const raw = record[field as string];
        if (raw) {
          const value = Number(raw);
          if (Number.isNaN(value) || value < 0) {
            rowErrors.push(`${field} must be a non-negative number, got "${raw}"`);
          } else {
            numericValues[field as string] = value;
          }
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ rowNumber, errors: rowErrors });
        return;
      }

      rows.push({
        rowNumber,
        name: record.name.trim(),
        role: role as PlayerRole,
        country: record.country.trim(),
        basePrice,
        age,
        matches: numericValues['matches'],
        runs: numericValues['runs'],
        wickets: numericValues['wickets'],
        average: numericValues['average'],
        strikeRate: numericValues['strikeRate'],
      });
    });

    return { rows, errors };
  }
}
