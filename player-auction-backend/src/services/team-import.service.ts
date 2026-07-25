import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { Types } from 'mongoose';
import { ApiError } from '@utils/ApiError';
import { eventBus } from '@events/EventBus';
import { ITeam, TeamModel } from '@models/Team.model';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';
import { IAuditLogRepository } from '@repositories/interfaces/IAuditLogRepository';

interface ImportRow {
  rowNumber: number;
  name: string;
  shortName: string;
  ownerId?: string;
  totalBudget: number;
  season: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface RowError {
  rowNumber: number;
  errors: string[];
}

const REQUIRED_COLUMNS = ['name'] as const;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const COLUMN_MAP: Record<string, string> = {
  name: 'name',
  team: 'name',
  teamname: 'name',
  'team name': 'name',
  title: 'name',
  shortname: 'shortName',
  short_name: 'shortName',
  'short name': 'shortName',
  code: 'shortName',
  tag: 'shortName',
  ownerid: 'ownerId',
  owner_id: 'ownerId',
  'owner id': 'ownerId',
  owner: 'ownerId',
  totalbudget: 'totalBudget',
  total_budget: 'totalBudget',
  'total budget': 'totalBudget',
  budget: 'totalBudget',
  points: 'totalBudget',
  season: 'season',
  year: 'season',
  primarycolor: 'primaryColor',
  primary_color: 'primaryColor',
  'primary color': 'primaryColor',
  secondarycolor: 'secondaryColor',
  secondary_color: 'secondaryColor',
  'secondary color': 'secondaryColor',
};

function normalizeRecord(rawRecord: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawRecord)) {
    const cleanKey = key.trim().toLowerCase();
    const targetKey = COLUMN_MAP[cleanKey] || key.trim();
    if (value !== undefined && value !== null) {
      normalized[targetKey] = String(value).trim();
    }
  }
  return normalized;
}

export class TeamImportService {
  constructor(
    private readonly teamRepository: ITeamRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async importFromCsv(buffer: Buffer, actorId: string): Promise<{ imported: number; teams: ITeam[] }> {
    const rawRecords: Record<string, string>[] = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const records = rawRecords.map(normalizeRecord);
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
      const rawRecord: Record<string, string> = {};
      headers.forEach((header, index) => {
        rawRecord[header] = String(values[index + 1] ?? '').trim();
      });
      records.push(normalizeRecord(rawRecord));
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
      ...(row.ownerId && Types.ObjectId.isValid(row.ownerId) ? { owner: row.ownerId } : {}),
      totalBudget: row.totalBudget,
      remainingBudget: row.totalBudget,
      season: row.season,
      primaryColor: row.primaryColor ?? '#2fd0ff',
      secondaryColor: row.secondaryColor ?? '#0b0e14',
      players: [],
      retentions: [],
    }));

    try {
      const created = await TeamModel.insertMany(documents, { ordered: true });
      const teams = created as unknown as ITeam[];

      const plainTeams = teams.map((t) => t.toObject({ virtuals: true }));

      Promise.resolve()
        .then(() => {
          if (actorId && Types.ObjectId.isValid(actorId)) {
            return this.auditLogRepository.record({
              actor: actorId,
              action: 'team.bulkImported',
              entityType: 'Team',
              entityId: 'bulk',
              after: { count: teams.length, names: teams.map((t) => t.name) },
            });
          }
        })
        .catch(() => { /* audit failure must not surface as a 500 */ })
        .finally(() => {
          teams.forEach((team) => eventBus.emit('team.created', { team }));
        });

      return { imported: teams.length, teams: plainTeams as unknown as ITeam[] };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database error during team import';
      throw ApiError.badRequest(`Import failed: ${message}`);
    }
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

      const name = record.name?.trim() || '';
      if (!name) {
        rowErrors.push('Missing required column "name"');
      }

      // Generate shortName automatically if not provided
      let shortName = record.shortName?.trim().toUpperCase() || '';
      if (!shortName && name) {
        shortName = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'TEAM';
      }
      if (shortName.length > 5) {
        shortName = shortName.slice(0, 5);
      }

      const totalBudget = record.totalBudget ? Number(record.totalBudget) : 1000;
      if (record.totalBudget && (Number.isNaN(totalBudget) || totalBudget < 0)) {
        rowErrors.push(`totalBudget must be a non-negative number, got "${record.totalBudget}"`);
      }

      const season = record.season?.trim() || '2026';

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
        name,
        shortName,
        ownerId: record.ownerId?.trim() || undefined,
        totalBudget,
        season,
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


