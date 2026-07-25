import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { Types } from 'mongoose';
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
  passingYear?: number;
  previousTeam?: string;
  appearances?: number;
  goals?: number;
  assists?: number;
}

interface RowError {
  rowNumber: number;
  errors: string[];
}

const COLUMN_MAP: Record<string, string> = {
  name: 'name',
  player: 'name',
  playername: 'name',
  'player name': 'name',
  role: 'role',
  position: 'role',
  pos: 'role',
  type: 'role',
  category: 'role',
  country: 'country',
  nation: 'country',
  nationality: 'country',
  baseprice: 'basePrice',
  base_price: 'basePrice',
  'base price': 'basePrice',
  price: 'basePrice',
  cost: 'basePrice',
  passingyear: 'passingYear',
  passing_year: 'passingYear',
  'passing year': 'passingYear',
  year: 'passingYear',
  batch: 'passingYear',
  previousteam: 'previousTeam',
  previous_team: 'previousTeam',
  'previous team': 'previousTeam',
  lastteam: 'previousTeam',
  'last team': 'previousTeam',
  age: 'age',
  appearances: 'appearances',
  apps: 'appearances',
  matches: 'appearances',
  goals: 'goals',
  assists: 'assists',
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

function normalizeRole(rawRole?: string): PlayerRole {
  if (!rawRole) return PlayerRole.MIDFIELDER;
  const upper = rawRole.trim().toUpperCase();
  if (
    upper === 'GK' ||
    upper === 'GOALKEEPER' ||
    upper === 'KEEP' ||
    upper === 'KEEPER' ||
    upper === 'WICKETKEEPER' ||
    upper === 'WK'
  ) {
    return PlayerRole.GOALKEEPER;
  }
  if (
    upper === 'DEFENDER' ||
    upper === 'DEF' ||
    upper === 'BACK' ||
    upper === 'CB' ||
    upper === 'LB' ||
    upper === 'RB' ||
    upper === 'LWB' ||
    upper === 'RWB' ||
    upper === 'BOWLER' ||
    upper === 'BOWL'
  ) {
    return PlayerRole.DEFENDER;
  }
  if (
    upper === 'MIDFIELDER' ||
    upper === 'MID' ||
    upper === 'CM' ||
    upper === 'CAM' ||
    upper === 'CDM' ||
    upper === 'RM' ||
    upper === 'LM' ||
    upper === 'ALL-ROUNDER' ||
    upper === 'ALLROUNDER' ||
    upper === 'AR' ||
    upper === 'ALL ROUNDER'
  ) {
    return PlayerRole.MIDFIELDER;
  }
  if (
    upper === 'FORWARD' ||
    upper === 'FWD' ||
    upper === 'STRIKER' ||
    upper === 'ST' ||
    upper === 'ATTACKER' ||
    upper === 'WINGER' ||
    upper === 'LW' ||
    upper === 'RW' ||
    upper === 'SS' ||
    upper === 'BATSMAN' ||
    upper === 'BAT' ||
    upper === 'BATTER'
  ) {
    return PlayerRole.FORWARD;
  }
  return PlayerRole.MIDFIELDER;
}

export class PlayerImportService {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async importFromCsv(buffer: Buffer, actorId: string): Promise<{ imported: number; players: IPlayer[] }> {
    const rawRecords: Record<string, string>[] = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const records = rawRecords.map(normalizeRecord);
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
      country: row.country || 'India',
      age: row.age,
      passingYear: row.passingYear ?? 2026,
      previousTeam: row.previousTeam,
      basePrice: row.basePrice,
      auctionStatus: PlayerAuctionStatus.PENDING,
      isRetained: false,
      stats: {
        appearances: row.appearances ?? 0,
        goals: row.goals,
        assists: row.assists,
      },
    }));

    try {
      const created = await PlayerModel.insertMany(documents, { ordered: true });
      const players = created as unknown as IPlayer[];

      // Convert to plain objects immediately so res.json() / socket serialization
      // never touches raw Mongoose Document internals (circular refs, getters, etc.)
      const plainPlayers = players.map((p) => p.toObject({ virtuals: true }));

      // Fire-and-forget: audit + realtime notifications — errors here must NOT
      // roll back an already-committed insert, so we swallow them gracefully.
      Promise.resolve()
        .then(() => {
          if (actorId && Types.ObjectId.isValid(actorId)) {
            return this.auditLogRepository.record({
              actor: actorId,
              action: 'player.bulkImported',
              entityType: 'Player',
              entityId: 'bulk',
              after: { count: players.length, names: players.map((p) => p.name) },
            });
          }
          return null;
        })
        .catch(() => { /* audit failure must not surface as a 500 */ })
        .finally(() => {
          players.forEach((player) => eventBus.emit('player.created', { player }));
        });

      return { imported: players.length, players: plainPlayers as unknown as IPlayer[] };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database error during player import';
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

      const role = normalizeRole(record.role);

      let basePrice = Number(record.basePrice);
      if (!record.basePrice || Number.isNaN(basePrice) || basePrice < 0) {
        basePrice = 100;
      }

      const country = record.country?.trim() || 'India';

      const age = record.age ? Number(record.age) : undefined;
      if (record.age && (Number.isNaN(age) || (age as number) < 14 || (age as number) > 60)) {
        rowErrors.push(`age must be between 14 and 60, got "${record.age}"`);
      }

      const passingYear = record.passingYear ? Number(record.passingYear) : 2026;

      const numericFields: Array<keyof ImportRow> = ['appearances', 'goals', 'assists'];
      const numericValues: Partial<Record<string, number>> = {};
      for (const field of numericFields) {
        const raw = record[field as string];
        if (raw) {
          const value = Number(raw);
          if (!Number.isNaN(value) && value >= 0) {
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
        name,
        role,
        country,
        basePrice,
        age,
        passingYear,
        previousTeam: record.previousTeam?.trim() || undefined,
        appearances: numericValues['appearances'],
        goals: numericValues['goals'],
        assists: numericValues['assists'],
      });
    });

    return { rows, errors };
  }
}

