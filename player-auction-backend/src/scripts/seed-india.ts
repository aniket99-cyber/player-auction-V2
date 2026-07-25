/**
 * India Auction Seed Script
 * Creates 50 Indian players, 8 IPL-style teams, and 8 owners from scratch.
 *
 * Run with: npm run seed-india
 *
 * WARNING: This script wipes ALL existing teams, owners, players, bids, and
 * auctions before seeding fresh data. Use only on a fresh / dev database.
 */
import crypto from 'crypto';

(globalThis as typeof globalThis & { crypto: typeof crypto }).crypto = crypto;

import { connectDatabase, disconnectDatabase } from '@config/database';
import { UserModel } from '@models/User.model';
import { TeamModel } from '@models/Team.model';
import { PlayerModel } from '@models/Player.model';
import { OwnerModel } from '@models/Owner.model';
import { AuctionModel } from '@models/Auction.model';
import { BidModel } from '@models/Bid.model';
import {
  UserRole,
  PlayerRole,
  PlayerAuctionStatus,
  AuctionStatus,
  AuctionSelectionMode,
} from '@constants/enums';
import { logger } from '@utils/logger';
import bcrypt from 'bcryptjs';

const SEASON = '2026';

// ─── 8 Teams ────────────────────────────────────────────────────────────────
const TEAM_SEEDS = [
  { name: 'Mumbai Mavericks',   shortName: 'MUM',  primaryColor: '#1e3a8a', secondaryColor: '#fbbf24' },
  { name: 'Delhi Dynamos',      shortName: 'DEL',  primaryColor: '#dc2626', secondaryColor: '#f8fafc' },
  { name: 'Bengaluru Blasters', shortName: 'BLR',  primaryColor: '#7c3aed', secondaryColor: '#f8fafc' },
  { name: 'Kolkata Knights',    shortName: 'KOL',  primaryColor: '#854d0e', secondaryColor: '#fef9c3' },
  { name: 'Chennai Challengers',shortName: 'CHN',  primaryColor: '#facc15', secondaryColor: '#1e293b' },
  { name: 'Hyderabad Heroes',   shortName: 'HYD',  primaryColor: '#f97316', secondaryColor: '#1c1917' },
  { name: 'Punjab Panthers',    shortName: 'PUN',  primaryColor: '#16a34a', secondaryColor: '#f8fafc' },
  { name: 'Rajasthan Royals',   shortName: 'RAJ',  primaryColor: '#db2777', secondaryColor: '#f8fafc' },
];

// ─── 8 Owners (one per team) ─────────────────────────────────────────────────
const OWNER_NAMES = [
  'Ratan Mehta',
  'Sunita Kapoor',
  'Anil Sharma',
  'Priya Banerjee',
  'Vijay Krishnamurthy',
  'Lakshmi Reddy',
  'Gurpreet Singh',
  'Asha Rajput',
];

// ─── 50 Indian Players ───────────────────────────────────────────────────────
// Goalkeepers × 6, Defenders × 14, Midfielders × 18, Forwards × 12 = 50
const PLAYER_SEEDS: Array<{
  name: string;
  role: PlayerRole;
  passingYear: number;
  age: number;
  previousTeam: string;
  basePrice: number;
  stats: { appearances: number; goals?: number; assists?: number };
}> = [
  // ── Goalkeepers (6) ───────────────────────────────────────────────────────
  {
    name: 'Gurpreet Singh Sandhu',
    role: PlayerRole.GOALKEEPER,
    passingYear: 2010,
    age: 32,
    previousTeam: 'Blue House',
    basePrice: 90,
    stats: { appearances: 68, goals: 0, assists: 0 },
  },
  {
    name: 'Amrinder Singh',
    role: PlayerRole.GOALKEEPER,
    passingYear: 2013,
    age: 31,
    previousTeam: 'Red House',
    basePrice: 70,
    stats: { appearances: 52 },
  },
  {
    name: 'Vishal Kaith',
    role: PlayerRole.GOALKEEPER,
    passingYear: 2015,
    age: 30,
    previousTeam: 'Green House',
    basePrice: 65,
    stats: { appearances: 44 },
  },
  {
    name: 'Dheeraj Singh Moirangthem',
    role: PlayerRole.GOALKEEPER,
    passingYear: 2016,
    age: 27,
    previousTeam: 'Gold House',
    basePrice: 60,
    stats: { appearances: 36 },
  },
  {
    name: 'Lalthuammawia Ralte',
    role: PlayerRole.GOALKEEPER,
    passingYear: 2012,
    age: 34,
    previousTeam: 'Blue House',
    basePrice: 55,
    stats: { appearances: 48 },
  },
  {
    name: 'Phurba Lachenpa',
    role: PlayerRole.GOALKEEPER,
    passingYear: 2014,
    age: 32,
    previousTeam: 'Red House',
    basePrice: 50,
    stats: { appearances: 30 },
  },

  // ── Defenders (14) ────────────────────────────────────────────────────────
  {
    name: 'Sandesh Jhingan',
    role: PlayerRole.DEFENDER,
    passingYear: 2012,
    age: 31,
    previousTeam: 'Green House',
    basePrice: 95,
    stats: { appearances: 82, goals: 5 },
  },
  {
    name: 'Subhasish Bose',
    role: PlayerRole.DEFENDER,
    passingYear: 2014,
    age: 30,
    previousTeam: 'Gold House',
    basePrice: 80,
    stats: { appearances: 65, goals: 3 },
  },
  {
    name: 'Pritam Kotal',
    role: PlayerRole.DEFENDER,
    passingYear: 2011,
    age: 33,
    previousTeam: 'Blue House',
    basePrice: 85,
    stats: { appearances: 70, goals: 2 },
  },
  {
    name: 'Mandar Rao Dessai',
    role: PlayerRole.DEFENDER,
    passingYear: 2013,
    age: 33,
    previousTeam: 'Red House',
    basePrice: 75,
    stats: { appearances: 60, goals: 4 },
  },
  {
    name: 'Narender Gehlot',
    role: PlayerRole.DEFENDER,
    passingYear: 2015,
    age: 29,
    previousTeam: 'Green House',
    basePrice: 65,
    stats: { appearances: 44 },
  },
  {
    name: 'Anas Edathodika',
    role: PlayerRole.DEFENDER,
    passingYear: 2009,
    age: 36,
    previousTeam: 'Gold House',
    basePrice: 60,
    stats: { appearances: 58, goals: 2 },
  },
  {
    name: 'Rahul Bheke',
    role: PlayerRole.DEFENDER,
    passingYear: 2013,
    age: 33,
    previousTeam: 'Blue House',
    basePrice: 72,
    stats: { appearances: 55, goals: 3 },
  },
  {
    name: 'Seriton Fernandes',
    role: PlayerRole.DEFENDER,
    passingYear: 2016,
    age: 28,
    previousTeam: 'Red House',
    basePrice: 60,
    stats: { appearances: 38 },
  },
  {
    name: 'Mehtab Singh',
    role: PlayerRole.DEFENDER,
    passingYear: 2017,
    age: 25,
    previousTeam: 'Green House',
    basePrice: 55,
    stats: { appearances: 28 },
  },
  {
    name: 'Roshan Singh',
    role: PlayerRole.DEFENDER,
    passingYear: 2016,
    age: 27,
    previousTeam: 'Gold House',
    basePrice: 50,
    stats: { appearances: 22 },
  },
  {
    name: 'Chinglensana Singh',
    role: PlayerRole.DEFENDER,
    passingYear: 2014,
    age: 30,
    previousTeam: 'Blue House',
    basePrice: 58,
    stats: { appearances: 35 },
  },
  {
    name: 'Akash Mishra',
    role: PlayerRole.DEFENDER,
    passingYear: 2018,
    age: 24,
    previousTeam: 'Red House',
    basePrice: 52,
    stats: { appearances: 20, assists: 3 },
  },
  {
    name: 'Jerry Lalrinzuala',
    role: PlayerRole.DEFENDER,
    passingYear: 2017,
    age: 26,
    previousTeam: 'Green House',
    basePrice: 55,
    stats: { appearances: 30, goals: 1 },
  },
  {
    name: 'Asish Rai',
    role: PlayerRole.DEFENDER,
    passingYear: 2015,
    age: 29,
    previousTeam: 'Gold House',
    basePrice: 62,
    stats: { appearances: 42 },
  },

  // ── Midfielders (18) ──────────────────────────────────────────────────────
  {
    name: 'Sunil Chhetri',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2002,
    age: 39,
    previousTeam: 'Blue House',
    basePrice: 100,
    stats: { appearances: 150, goals: 94, assists: 40 },
  },
  {
    name: 'Anirudh Thapa',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2016,
    age: 26,
    previousTeam: 'Red House',
    basePrice: 85,
    stats: { appearances: 58, goals: 8, assists: 14 },
  },
  {
    name: 'Sahal Abdul Samad',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2017,
    age: 26,
    previousTeam: 'Green House',
    basePrice: 82,
    stats: { appearances: 50, goals: 12, assists: 18 },
  },
  {
    name: 'Brandon Fernandes',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2015,
    age: 28,
    previousTeam: 'Gold House',
    basePrice: 80,
    stats: { appearances: 52, goals: 10, assists: 20 },
  },
  {
    name: 'Liston Colaco',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2018,
    age: 24,
    previousTeam: 'Blue House',
    basePrice: 78,
    stats: { appearances: 40, goals: 11, assists: 15 },
  },
  {
    name: 'Lalengmawia Ralte (Apuia)',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2019,
    age: 22,
    previousTeam: 'Red House',
    basePrice: 72,
    stats: { appearances: 35, goals: 5, assists: 9 },
  },
  {
    name: 'Jeakson Singh Thounaojam',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2017,
    age: 25,
    previousTeam: 'Green House',
    basePrice: 70,
    stats: { appearances: 38, goals: 4, assists: 7 },
  },
  {
    name: 'Rowllin Borges',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2014,
    age: 31,
    previousTeam: 'Gold House',
    basePrice: 68,
    stats: { appearances: 55, goals: 6, assists: 12 },
  },
  {
    name: 'Pronay Halder',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2014,
    age: 32,
    previousTeam: 'Blue House',
    basePrice: 65,
    stats: { appearances: 50, goals: 5, assists: 8 },
  },
  {
    name: 'Amarjit Singh Kiyam',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2018,
    age: 24,
    previousTeam: 'Red House',
    basePrice: 62,
    stats: { appearances: 30, goals: 3, assists: 6 },
  },
  {
    name: 'Bipin Singh',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2015,
    age: 28,
    previousTeam: 'Green House',
    basePrice: 75,
    stats: { appearances: 48, goals: 14, assists: 10 },
  },
  {
    name: 'Lallianzuala Chhangte',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2017,
    age: 25,
    previousTeam: 'Gold House',
    basePrice: 72,
    stats: { appearances: 44, goals: 13, assists: 8 },
  },
  {
    name: 'Naorem Mahesh Singh',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2019,
    age: 22,
    previousTeam: 'Blue House',
    basePrice: 60,
    stats: { appearances: 28, goals: 7, assists: 5 },
  },
  {
    name: 'Vikram Pratap Singh',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2020,
    age: 21,
    previousTeam: 'Red House',
    basePrice: 58,
    stats: { appearances: 22, goals: 5, assists: 4 },
  },
  {
    name: 'Suresh Singh Wangjam',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2018,
    age: 24,
    previousTeam: 'Green House',
    basePrice: 60,
    stats: { appearances: 32, goals: 4, assists: 7 },
  },
  {
    name: 'Komal Thatal',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2017,
    age: 25,
    previousTeam: 'Gold House',
    basePrice: 55,
    stats: { appearances: 28, goals: 6, assists: 5 },
  },
  {
    name: 'Glan Martins',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2016,
    age: 27,
    previousTeam: 'Blue House',
    basePrice: 65,
    stats: { appearances: 40, goals: 5, assists: 11 },
  },
  {
    name: 'Nikhil Poojary',
    role: PlayerRole.MIDFIELDER,
    passingYear: 2018,
    age: 25,
    previousTeam: 'Red House',
    basePrice: 52,
    stats: { appearances: 24, goals: 3, assists: 4 },
  },

  // ── Forwards (12) ─────────────────────────────────────────────────────────
  {
    name: 'Manvir Singh',
    role: PlayerRole.FORWARD,
    passingYear: 2016,
    age: 27,
    previousTeam: 'Green House',
    basePrice: 90,
    stats: { appearances: 55, goals: 26, assists: 10 },
  },
  {
    name: 'Farukh Choudhary',
    role: PlayerRole.FORWARD,
    passingYear: 2017,
    age: 26,
    previousTeam: 'Gold House',
    basePrice: 85,
    stats: { appearances: 48, goals: 22, assists: 8 },
  },
  {
    name: 'Ishan Pandita',
    role: PlayerRole.FORWARD,
    passingYear: 2018,
    age: 25,
    previousTeam: 'Blue House',
    basePrice: 78,
    stats: { appearances: 38, goals: 18, assists: 6 },
  },
  {
    name: 'Rahim Ali',
    role: PlayerRole.FORWARD,
    passingYear: 2019,
    age: 22,
    previousTeam: 'Red House',
    basePrice: 72,
    stats: { appearances: 30, goals: 14, assists: 4 },
  },
  {
    name: 'Lalrindika Ralte',
    role: PlayerRole.FORWARD,
    passingYear: 2015,
    age: 28,
    previousTeam: 'Green House',
    basePrice: 70,
    stats: { appearances: 45, goals: 16, assists: 9 },
  },
  {
    name: 'Shilton Paul',
    role: PlayerRole.FORWARD,
    passingYear: 2014,
    age: 30,
    previousTeam: 'Gold House',
    basePrice: 65,
    stats: { appearances: 42, goals: 13, assists: 7 },
  },
  {
    name: 'Edmund Lalrindika',
    role: PlayerRole.FORWARD,
    passingYear: 2016,
    age: 27,
    previousTeam: 'Blue House',
    basePrice: 68,
    stats: { appearances: 40, goals: 15, assists: 5 },
  },
  {
    name: 'Ashique Kuruniyan',
    role: PlayerRole.FORWARD,
    passingYear: 2017,
    age: 26,
    previousTeam: 'Red House',
    basePrice: 80,
    stats: { appearances: 50, goals: 20, assists: 12 },
  },
  {
    name: 'Henry Kisekka',
    role: PlayerRole.FORWARD,
    passingYear: 2015,
    age: 28,
    previousTeam: 'Green House',
    basePrice: 75,
    stats: { appearances: 44, goals: 19, assists: 7 },
  },
  {
    name: 'Vincy Barretto',
    role: PlayerRole.FORWARD,
    passingYear: 2013,
    age: 32,
    previousTeam: 'Gold House',
    basePrice: 65,
    stats: { appearances: 48, goals: 17, assists: 8 },
  },
  {
    name: 'Thoi Singh',
    role: PlayerRole.FORWARD,
    passingYear: 2018,
    age: 25,
    previousTeam: 'Blue House',
    basePrice: 62,
    stats: { appearances: 28, goals: 11, assists: 4 },
  },
  {
    name: 'Shreyas Bhosale',
    role: PlayerRole.FORWARD,
    passingYear: 2019,
    age: 23,
    previousTeam: 'Red House',
    basePrice: 58,
    stats: { appearances: 22, goals: 9, assists: 3 },
  },
];

// ─── Seed function ────────────────────────────────────────────────────────────
async function seedIndia(): Promise<void> {
  await connectDatabase();
  logger.info('🇮🇳  Seeding India auction data (8 teams · 8 owners · 50 players)...');

  // ── 1. Ensure admin user ──────────────────────────────────────────────────
  let admin = await UserModel.findOne({ email: 'admin@playerauction.com' });
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    admin = await UserModel.create({
      name: 'Admin',
      email: 'admin@playerauction.com',
      passwordHash,
      role: UserRole.ADMIN,
    });
    logger.info('Created admin user (admin@playerauction.com / Admin@12345)');
  } else {
    logger.info('Admin user already exists — skipping creation');
  }

  // ── 2. Wipe existing data (fresh slate) ───────────────────────────────────
  logger.info('Clearing existing teams, owners, players, bids & auctions...');
  const existingPlayers = await PlayerModel.find({});
  const existingPlayerIds = existingPlayers.map((p) => p._id);

  // Cascade cleanup
  if (existingPlayerIds.length) {
    await BidModel.deleteMany({ player: { $in: existingPlayerIds } });
  }
  await AuctionModel.deleteMany({});
  await PlayerModel.deleteMany({});
  await OwnerModel.deleteMany({});
  await TeamModel.deleteMany({});
  logger.info('✓ Cleared all existing data');

  // ── 3. Create 8 teams ─────────────────────────────────────────────────────
  const teams = [];
  for (const seed of TEAM_SEEDS) {
    const team = await TeamModel.create({
      ...seed,
      owner: admin._id,
      totalBudget: 1000,
      remainingBudget: 1000,
      players: [],
      retentions: [],
      season: SEASON,
    });
    teams.push(team);
  }
  logger.info(`✓ Created ${teams.length} teams`);

  // ── 4. Create 8 owners ────────────────────────────────────────────────────
  for (let i = 0; i < teams.length; i++) {
    await OwnerModel.create({ team: teams[i]._id, name: OWNER_NAMES[i] });
  }
  logger.info(`✓ Created ${OWNER_NAMES.length} owners`);

  // ── 5. Create 50 Indian players ───────────────────────────────────────────
  const players = await PlayerModel.insertMany(
    PLAYER_SEEDS.map((seed) => ({
      ...seed,
      country: 'India',
      auctionStatus: PlayerAuctionStatus.PENDING,
      isRetained: false,
    }))
  );
  logger.info(`✓ Created ${players.length} Indian players`);

  // ── 6. Retain 2 players per team (demo roster) ────────────────────────────
  let playerIndex = 0;
  for (const team of teams) {
    const retainedPlayers = players.slice(playerIndex, playerIndex + 2);
    playerIndex += 2;

    let retentionOrder = 1;
    for (const player of retainedPlayers) {
      const retentionPrice = Math.round((player as any).basePrice * 1.5);
      await TeamModel.findOneAndUpdate(
        { _id: team._id, remainingBudget: { $gte: retentionPrice } },
        {
          $push: {
            retentions: {
              player: player._id,
              retentionPrice,
              retentionOrder: retentionOrder++,
              approvedBy: admin._id,
              retainedAt: new Date(),
            },
          },
          $addToSet: { players: player._id },
          $inc: { remainingBudget: -retentionPrice },
        },
      );
      await PlayerModel.findByIdAndUpdate(player._id, {
        isRetained: true,
        auctionStatus: PlayerAuctionStatus.RETAINED,
        soldTo: team._id,
        soldPrice: retentionPrice,
      });
    }
  }
  logger.info('✓ Retained 2 players per team (demo roster)');

  // ── 7. Create auction with all remaining PENDING players ──────────────────
  const pendingPlayers = await PlayerModel.find({ auctionStatus: PlayerAuctionStatus.PENDING });
  await AuctionModel.create({
    name: 'India Premier Cup 2026 — Main Auction',
    status: AuctionStatus.DRAFT,
    playerQueue: pendingPlayers.map((p) => p._id),
    participatingTeams: teams.map((t) => t._id),
    bidIncrementRules: [
      { upTo: 100, increment: 5 },
      { upTo: 500, increment: 10 },
      { upTo: 1000, increment: 25 },
    ],
    selectionMode: AuctionSelectionMode.SEQUENTIAL,
    settings: { autoAdvance: true },
    createdBy: admin._id,
  });
  logger.info(`✓ Created auction "India Premier Cup 2026" with ${pendingPlayers.length} players in queue`);

  // ── Summary ───────────────────────────────────────────────────────────────
  logger.info('');
  logger.info('🎉  India seed complete!');
  logger.info(`   Teams   : ${teams.length}`);
  logger.info(`   Owners  : ${OWNER_NAMES.length}`);
  logger.info(`   Players : ${players.length} (${players.length - pendingPlayers.length} retained, ${pendingPlayers.length} in auction queue)`);
  logger.info(`   Login   : admin@playerauction.com / Admin@12345`);

  await disconnectDatabase();
}

seedIndia().catch((err) => {
  logger.error('India seed failed', { message: (err as Error).message, stack: (err as Error).stack });
  process.exit(1);
});
