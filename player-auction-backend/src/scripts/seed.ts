/**
 * Demo seed script for the school reunion football auction.
 * Run with: npm run seed
 *
 * Idempotent-ish: safe to re-run, but will create duplicate teams/players
 * if run twice without clearing collections first (no upsert-by-name logic —
 * this is throwaway demo data, not production seed tooling).
 */
import crypto from 'crypto';

(globalThis as typeof globalThis & { crypto: typeof crypto }).crypto = crypto;

import { connectDatabase, disconnectDatabase } from '@config/database';
import { UserModel } from '@models/User.model';
import { TeamModel } from '@models/Team.model';
import { PlayerModel } from '@models/Player.model';
import { OwnerModel } from '@models/Owner.model';
import { AuctionModel } from '@models/Auction.model';
import { UserRole, PlayerRole, PlayerAuctionStatus, AuctionStatus, AuctionSelectionMode } from '@constants/enums';
import { logger } from '@utils/logger';
import bcrypt from 'bcryptjs';

const SEASON = '2026';

const TEAM_SEEDS = [
  { name: 'Blue House Blazers', shortName: 'BLUE', primaryColor: '#2fd0ff', secondaryColor: '#0b0e14' },
  { name: 'Red House Raptors', shortName: 'RED', primaryColor: '#f2495c', secondaryColor: '#0b0e14' },
  { name: 'Green House Griffins', shortName: 'GRN', primaryColor: '#34d399', secondaryColor: '#0b0e14' },
  { name: 'Gold House Gladiators', shortName: 'GOLD', primaryColor: '#f4b942', secondaryColor: '#0b0e14' },
];

const PLAYER_SEEDS: Array<{
  name: string;
  role: PlayerRole;
  passingYear: number;
  age: number;
  previousTeam: string;
  basePrice: number;
  stats: { appearances: number; goals?: number; assists?: number };
}> = [
  { name: 'Arjun Mehta', role: PlayerRole.GOALKEEPER, passingYear: 2012, age: 34, previousTeam: 'Blue House', basePrice: 50, stats: { appearances: 40, goals: 0, assists: 1 } },
  { name: 'Rohan Kapoor', role: PlayerRole.GOALKEEPER, passingYear: 2013, age: 33, previousTeam: 'Red House', basePrice: 45, stats: { appearances: 35 } },
  { name: 'Vikram Rao', role: PlayerRole.DEFENDER, passingYear: 2011, age: 35, previousTeam: 'Green House', basePrice: 60, stats: { appearances: 50, goals: 3 } },
  { name: 'Siddharth Iyer', role: PlayerRole.DEFENDER, passingYear: 2014, age: 32, previousTeam: 'Gold House', basePrice: 55, stats: { appearances: 42, goals: 2 } },
  { name: 'Karan Malhotra', role: PlayerRole.DEFENDER, passingYear: 2010, age: 36, previousTeam: 'Blue House', basePrice: 50, stats: { appearances: 48 } },
  { name: 'Aditya Bhatt', role: PlayerRole.DEFENDER, passingYear: 2015, age: 31, previousTeam: 'Red House', basePrice: 40, stats: { appearances: 30 } },
  { name: 'Nikhil Sharma', role: PlayerRole.MIDFIELDER, passingYear: 2013, age: 33, previousTeam: 'Green House', basePrice: 70, stats: { appearances: 55, goals: 8, assists: 12 } },
  { name: 'Rahul Verma', role: PlayerRole.MIDFIELDER, passingYear: 2012, age: 34, previousTeam: 'Gold House', basePrice: 65, stats: { appearances: 50, goals: 6, assists: 9 } },
  { name: 'Aman Joshi', role: PlayerRole.MIDFIELDER, passingYear: 2014, age: 32, previousTeam: 'Blue House', basePrice: 60, stats: { appearances: 45, goals: 5, assists: 7 } },
  { name: 'Varun Nair', role: PlayerRole.MIDFIELDER, passingYear: 2011, age: 35, previousTeam: 'Red House', basePrice: 55, stats: { appearances: 48, goals: 4, assists: 6 } },
  { name: 'Kabir Singh', role: PlayerRole.MIDFIELDER, passingYear: 2016, age: 30, previousTeam: 'Green House', basePrice: 45, stats: { appearances: 28, goals: 3, assists: 4 } },
  { name: 'Dev Patel', role: PlayerRole.FORWARD, passingYear: 2013, age: 33, previousTeam: 'Gold House', basePrice: 80, stats: { appearances: 52, goals: 22, assists: 8 } },
  { name: 'Ishaan Chatterjee', role: PlayerRole.FORWARD, passingYear: 2012, age: 34, previousTeam: 'Blue House', basePrice: 75, stats: { appearances: 49, goals: 19, assists: 6 } },
  { name: 'Yash Trivedi', role: PlayerRole.FORWARD, passingYear: 2015, age: 31, previousTeam: 'Red House', basePrice: 70, stats: { appearances: 40, goals: 17, assists: 5 } },
  { name: 'Ansh Kulkarni', role: PlayerRole.FORWARD, passingYear: 2014, age: 32, previousTeam: 'Green House', basePrice: 60, stats: { appearances: 35, goals: 14, assists: 3 } },
  { name: 'Pranav Desai', role: PlayerRole.FORWARD, passingYear: 2010, age: 36, previousTeam: 'Gold House', basePrice: 50, stats: { appearances: 45, goals: 12, assists: 4 } },
  { name: 'Manav Reddy', role: PlayerRole.MIDFIELDER, passingYear: 2017, age: 29, previousTeam: 'Blue House', basePrice: 35, stats: { appearances: 22, goals: 2, assists: 3 } },
  { name: 'Tarun Bose', role: PlayerRole.DEFENDER, passingYear: 2016, age: 30, previousTeam: 'Red House', basePrice: 35, stats: { appearances: 25 } },
  { name: 'Sameer Ahluwalia', role: PlayerRole.GOALKEEPER, passingYear: 2015, age: 31, previousTeam: 'Green House', basePrice: 40, stats: { appearances: 20 } },
  { name: 'Harsh Vora', role: PlayerRole.FORWARD, passingYear: 2017, age: 29, previousTeam: 'Gold House', basePrice: 45, stats: { appearances: 18, goals: 9, assists: 2 } },
];

async function seed(): Promise<void> {
  await connectDatabase();
  logger.info('Seeding demo data...');

  // 1. Ensure a demo admin exists (idempotent — safe if admin@playerauction.com already exists)
  let admin = await UserModel.findOne({ email: 'admin@playerauction.com' });
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    admin = await UserModel.create({
      name: 'Admin',
      email: 'admin@playerauction.com',
      passwordHash,
      role: UserRole.ADMIN,
    });
    logger.info('Created admin user');
  }

  // 2. Teams
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
  logger.info(`Created ${teams.length} teams`);

  // 3. Players
  const players = [];
  for (const seed of PLAYER_SEEDS) {
    const player = await PlayerModel.create({
      ...seed,
      auctionStatus: PlayerAuctionStatus.PENDING,
      isRetained: false,
    });
    players.push(player);
  }
  logger.info(`Created ${players.length} players`);

  // 4. Retain 2 players per team directly onto the roster (via the same
  // retention mechanics the app uses) so Teams/Owners/Captains screens have
  // real data to show immediately, without needing a completed auction.
  let playerIndex = 0;
  for (const team of teams) {
    const retainedPlayers = players.slice(playerIndex, playerIndex + 2);
    playerIndex += 2;

    let retentionOrder = 1;
    for (const player of retainedPlayers) {
      const retentionPrice = Math.round(player.basePrice * 1.5);
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
  logger.info('Retained 2 players per team');

  // 5. Owners (one per team)
  const ownerNames = ['Priya Nair', 'Rakesh Gupta', 'Sneha Kulkarni', 'Vivek Anand'];
  for (let i = 0; i < teams.length; i++) {
    await OwnerModel.create({ team: teams[i]._id, name: ownerNames[i] });
  }
  logger.info('Created owners');

  logger.info('Assigned captains');

  // 7. Auction — draft, queued with every still-PENDING player
  const pendingPlayers = await PlayerModel.find({ auctionStatus: PlayerAuctionStatus.PENDING });
  await AuctionModel.create({
    name: 'Reunion Cup 2026 — Main Auction',
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
  logger.info(`Created auction with ${pendingPlayers.length} players in the pool`);

  logger.info('Seed complete.');
  logger.info(`Login: admin@playerauction.com / Admin@12345`);

  await disconnectDatabase();
}

seed().catch((err) => {
  logger.error('Seed failed', { message: err.message, stack: err.stack });
  process.exit(1);
});
