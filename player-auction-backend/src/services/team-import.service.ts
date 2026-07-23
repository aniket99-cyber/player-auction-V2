import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { ApiError } from '@utils/ApiError';
import { eventBus } from '@events/EventBus';
import { ITeam, TeamModel } from '@models/Team.model';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';
import { IAuditLogRepository } from '@repositories/interfaces/IAuditLogRepository';

interface ImportRow {
  rowNumber: number;
  name: string;
  shortName: string;
  ownerId: string;
  totalBudget: number;
  season: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface RowError {
  rowNumber: number;
  errors: string[];
}

const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
const REQUIRED_COLUMNS = ['name', 'shortName', 'ownerId', 'totalBudget', 'season'] as const;

export class TeamImportService {
  constructor(
    private readonly teamRepository: ITeamRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async importFromCsv(buffer: Buffer, actorId: string): Promise<{ imported: number; teams: ITeam[] }> {
    const records: Record<string, string>[] = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return this.importRecords(records, actorId);
  }

  async importFromExcel(buffer: Buffer, actorId: string): Promise<{ imported: number; teams: ITeam[] }> {
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
  ): Promise<{ imported: number; teams: ITeam[] }> {
    if (records.length === 0) {
      throw ApiError.badRequest('Import file contains no data rows');
    }

    const { rows, errors } = this.parseAndValidateRows(records);

    const duplicateErrors = await this.checkDuplicates(rows);
    errors.push(...duplicateErrors);

    if (errors.length > 0) {
      throw ApiError.badRequest('Import rejected — fix the errors below and re-upload', errors);
    }

    const documents = rows.map((row) => ({
      name: row.name,
      shortName: row.shortName,
      owner: row.ownerId,
      totalBudget: row.totalBudget,
      remainingBudget: row.totalBudget,
      season: row.season,
      primaryColor: row.primaryColor ?? '#2fd0ff',
      secondaryColor: row.secondaryColor ?? '#0b0e14',
      players: [],
      retentions: [],
    }));

    // insertMany with ordered:true (default) — since every row already passed
    // validation above, this is the "insert all" half of validate-all-then-insert-all;
    // a mid-batch failure here (e.g. a race against a concurrent create) still aborts
    // the remaining inserts rather than leaving a partial import silently applied.
    const created = await TeamModel.insertMany(documents, { ordered: true });
    const teams = created as unknown as ITeam[];

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'team.bulkImported',
      entityType: 'Team',
      entityId: 'bulk',
      after: { count: teams.length, names: teams.map((t) => t.name) },
    });

    teams.forEach((team) => eventBus.emit('team.created', { team }));

    return { imported: teams.length, teams };
  }

  private parseAndValidateRows(records: Record<string, string>[]): {
    rows: ImportRow[];
    errors: RowError[];
  } {
    const rows: ImportRow[] = [];
    const errors: RowError[] = [];

    records.forEach((record, index) => {
      const rowNumber = index + 2; // +1 for header row, +1 for 1-based numbering
      const rowErrors: string[] = [];

      for (const column of REQUIRED_COLUMNS) {
        if (!record[column] || record[column].trim() === '') {
          rowErrors.push(`Missing required column "${column}"`);
        }
      }

      const totalBudget = Number(record.totalBudget);
      if (record.totalBudget && (Number.isNaN(totalBudget) || totalBudget < 0)) {
        rowErrors.push(`totalBudget must be a non-negative number, got "${record.totalBudget}"`);
      }

      if (record.shortName && record.shortName.length > 5) {
        rowErrors.push(`shortName must be 5 characters or fewer, got "${record.shortName}"`);
      }

      if (record.primaryColor && !HEX_COLOR_PATTERN.test(record.primaryColor)) {
        rowErrors.push(`primaryColor "${record.primaryColor}" is not a valid hex color`);
      }

      if (record.secondaryColor && !HEX_COLOR_PATTERN.test(record.secondaryColor)) {
        rowErrors.push(`secondaryColor "${record.secondaryColor}" is not a valid hex color`);
      }

      if (rowErrors.length > 0) {
        errors.push({ rowNumber, errors: rowErrors });
        return;
      }

      rows.push({
        rowNumber,
        name: record.name.trim(),
        shortName: record.shortName.trim().toUpperCase(),
        ownerId: record.ownerId.trim(),
        totalBudget,
        season: record.season.trim(),
        primaryColor: record.primaryColor?.trim(),
        secondaryColor: record.secondaryColor?.trim(),
      });
    });

    return { rows, errors };
  }

  private async checkDuplicates(rows: ImportRow[]): Promise<RowError[]> {
    const errors: RowError[] = [];
    const seenInFile = new Set<string>();

    for (const row of rows) {
      const key = `${row.name.toLowerCase()}::${row.season}`;
      if (seenInFile.has(key)) {
        errors.push({
          rowNumber: row.rowNumber,
          errors: [`Duplicate team "${row.name}" for season ${row.season} within this file`],
        });
        continue;
      }
      seenInFile.add(key);

      const existing = await this.teamRepository.findOne({ name: row.name, season: row.season });
      if (existing) {
        errors.push({
          rowNumber: row.rowNumber,
          errors: [`Team "${row.name}" already exists for season ${row.season}`],
        });
      }
    }

    return errors;
  }
}
