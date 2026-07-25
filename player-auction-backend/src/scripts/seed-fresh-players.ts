/**
 * Fresh seed script: Adds 50 new players to existing teams.
 * Run AFTER reset-players.ts
 * 
 * Run with: npm run seed-fresh-players
 */
import crypto from 'crypto';

(globalThis as typeof globalThis & { crypto: typeof crypto }).crypto = crypto;

import { connectDatabase, disconnectDatabase } from '@config/database';
import { PlayerModel } from '@models/Player.model';
import { TeamModel } from '@models/Team.model';
import { AuctionModel } from '@models/Auction.model';
import { UserModel } from '@models/User.model';
import { PlayerRole, PlayerAuctionStatus, AuctionStatus } from '@constants/enums';
import { logger } from '@utils/logger';

const FRESH_PLAYERS = [
  // Goalkeepers (4)
  { name: 'Marco Silva', role: PlayerRole.GOALKEEPER, passingYear: 2014, age: 32, previousTeam: 'Blue House', basePrice: 55, stats: { appearances: 42 } },
  { name: 'Diego Santos', role: PlayerRole.GOALKEEPER, passingYear: 2015, age: 31, previousTeam: 'Red House', basePrice: 50, stats: { appearances: 38 } },
  { name: 'Carlos Mendez', role: PlayerRole.GOALKEEPER, passingYear: 2012, age: 34, previousTeam: 'Green House', basePrice: 60, stats: { appearances: 48 } },
  { name: 'Juan Fernandez', role: PlayerRole.GOALKEEPER, passingYear: 2016, age: 30, previousTeam: 'Gold House', basePrice: 45, stats: { appearances: 30 } },

  // Defenders (16)
  { name: 'Lucas Almeida', role: PlayerRole.DEFENDER, passingYear: 2013, age: 33, previousTeam: 'Blue House', basePrice: 65, stats: { appearances: 50, goals: 4 } },
  { name: 'Felipe Costa', role: PlayerRole.DEFENDER, passingYear: 2014, age: 32, previousTeam: 'Red House', basePrice: 60, stats: { appearances: 45, goals: 3 } },
  { name: 'Thiago Oliveira', role: PlayerRole.DEFENDER, passingYear: 2011, age: 35, previousTeam: 'Green House', basePrice: 70, stats: { appearances: 55, goals: 5 } },
  { name: 'Ricardo Pereira', role: PlayerRole.DEFENDER, passingYear: 2015, age: 31, previousTeam: 'Gold House', basePrice: 50, stats: { appearances: 40, goals: 2 } },
  { name: 'Miguel Garcia', role: PlayerRole.DEFENDER, passingYear: 2012, age: 34, previousTeam: 'Blue House', basePrice: 65, stats: { appearances: 48, goals: 3 } },
  { name: 'David Rodriguez', role: PlayerRole.DEFENDER, passingYear: 2014, age: 32, previousTeam: 'Red House', basePrice: 60, stats: { appearances: 42, goals: 2 } },
  { name: 'Jose Martinez', role: PlayerRole.DEFENDER, passingYear: 2010, age: 36, previousTeam: 'Green House', basePrice: 55, stats: { appearances: 50 } },
  { name: 'Manuel Sanchez', role: PlayerRole.DEFENDER, passingYear: 2016, age: 30, previousTeam: 'Gold House', basePrice: 45, stats: { appearances: 28 } },
  { name: 'Alessandro Rossi', role: PlayerRole.DEFENDER, passingYear: 2013, age: 33, previousTeam: 'Blue House', basePrice: 60, stats: { appearances: 45, goals: 2 } },
  { name: 'Marco Verdi', role: PlayerRole.DEFENDER, passingYear: 2015, age: 31, previousTeam: 'Red House', basePrice: 55, stats: { appearances: 38 } },
  { name: 'Antonio Bianchi', role: PlayerRole.DEFENDER, passingYear: 2012, age: 34, previousTeam: 'Green House', basePrice: 65, stats: { appearances: 48, goals: 1 } },
  { name: 'Leonardo Rosso', role: PlayerRole.DEFENDER, passingYear: 2014, age: 32, previousTeam: 'Gold House', basePrice: 50, stats: { appearances: 40 } },
  { name: 'Lionel Blanc', role: PlayerRole.DEFENDER, passingYear: 2011, age: 35, previousTeam: 'Blue House', basePrice: 70, stats: { appearances: 52, goals: 3 } },
  { name: 'Thomas Durand', role: PlayerRole.DEFENDER, passingYear: 2013, age: 33, previousTeam: 'Red House', basePrice: 60, stats: { appearances: 45, goals: 2 } },

  // Midfielders (20)
  { name: 'Iniesta Silva', role: PlayerRole.MIDFIELDER, passingYear: 2012, age: 34, previousTeam: 'Blue House', basePrice: 80, stats: { appearances: 55, goals: 10, assists: 14 } },
  { name: 'Xavi Hernandez', role: PlayerRole.MIDFIELDER, passingYear: 2013, age: 33, previousTeam: 'Red House', basePrice: 75, stats: { appearances: 50, goals: 9, assists: 12 } },
  { name: 'Sergio Busquets', role: PlayerRole.MIDFIELDER, passingYear: 2011, age: 35, previousTeam: 'Green House', basePrice: 85, stats: { appearances: 58, goals: 5, assists: 8 } },
  { name: 'Jordi Alba', role: PlayerRole.MIDFIELDER, passingYear: 2014, age: 32, previousTeam: 'Gold House', basePrice: 65, stats: { appearances: 42, goals: 6, assists: 9 } },
  { name: 'Andrés Iniesta', role: PlayerRole.MIDFIELDER, passingYear: 2015, age: 31, previousTeam: 'Blue House', basePrice: 70, stats: { appearances: 38, goals: 7, assists: 10 } },
  { name: 'Paulo Dybala', role: PlayerRole.MIDFIELDER, passingYear: 2016, age: 30, previousTeam: 'Red House', basePrice: 65, stats: { appearances: 35, goals: 12, assists: 7 } },
  { name: 'Gonzalo Higuain', role: PlayerRole.MIDFIELDER, passingYear: 2012, age: 34, previousTeam: 'Green House', basePrice: 75, stats: { appearances: 48, goals: 15, assists: 5 } },
  { name: 'Ever Banega', role: PlayerRole.MIDFIELDER, passingYear: 2013, age: 33, previousTeam: 'Gold House', basePrice: 70, stats: { appearances: 45, goals: 8, assists: 11 } },
  { name: 'Cristian Benavente', role: PlayerRole.MIDFIELDER, passingYear: 2014, age: 32, previousTeam: 'Blue House', basePrice: 60, stats: { appearances: 40, goals: 6, assists: 8 } },
  { name: 'Arturo Vidal', role: PlayerRole.MIDFIELDER, passingYear: 2010, age: 36, previousTeam: 'Red House', basePrice: 80, stats: { appearances: 55, goals: 11, assists: 9 } },
  { name: 'Alexis Sanchez', role: PlayerRole.MIDFIELDER, passingYear: 2011, age: 35, previousTeam: 'Green House', basePrice: 75, stats: { appearances: 50, goals: 16, assists: 6 } },
  { name: 'Eduardo Vargas', role: PlayerRole.MIDFIELDER, passingYear: 2013, age: 33, previousTeam: 'Gold House', basePrice: 65, stats: { appearances: 42, goals: 10, assists: 4 } },
  { name: 'Gary Medel', role: PlayerRole.MIDFIELDER, passingYear: 2014, age: 32, previousTeam: 'Blue House', basePrice: 55, stats: { appearances: 38, goals: 3, assists: 2 } },
  { name: 'Mohamed Salah', role: PlayerRole.MIDFIELDER, passingYear: 2015, age: 31, previousTeam: 'Red House', basePrice: 85, stats: { appearances: 45, goals: 18, assists: 10 } },
  { name: 'Amr Warda', role: PlayerRole.MIDFIELDER, passingYear: 2016, age: 30, previousTeam: 'Green House', basePrice: 60, stats: { appearances: 28, goals: 8, assists: 5 } },
  { name: 'Ahmed Elmohamady', role: PlayerRole.MIDFIELDER, passingYear: 2013, age: 33, previousTeam: 'Gold House', basePrice: 50, stats: { appearances: 35, goals: 2, assists: 3 } },
  { name: 'Ramy Rabia', role: PlayerRole.MIDFIELDER, passingYear: 2014, age: 32, previousTeam: 'Blue House', basePrice: 55, stats: { appearances: 30, goals: 4, assists: 6 } },
  { name: 'Vinicius Jr', role: PlayerRole.MIDFIELDER, passingYear: 2017, age: 29, previousTeam: 'Red House', basePrice: 70, stats: { appearances: 32, goals: 13, assists: 8 } },
  { name: 'Neymar Jr', role: PlayerRole.MIDFIELDER, passingYear: 2014, age: 32, previousTeam: 'Green House', basePrice: 90, stats: { appearances: 50, goals: 20, assists: 15 } },
  { name: 'Rodrygo Goes', role: PlayerRole.MIDFIELDER, passingYear: 2018, age: 28, previousTeam: 'Gold House', basePrice: 60, stats: { appearances: 25, goals: 9, assists: 5 } },

  // Forwards (10)
  { name: 'Cristiano Ronaldo', role: PlayerRole.FORWARD, passingYear: 2009, age: 37, previousTeam: 'Blue House', basePrice: 95, stats: { appearances: 60, goals: 35, assists: 10 } },
  { name: 'Eusebio Fernandes', role: PlayerRole.FORWARD, passingYear: 2012, age: 34, previousTeam: 'Red House', basePrice: 80, stats: { appearances: 48, goals: 22, assists: 6 } },
  { name: 'Luis Figo', role: PlayerRole.FORWARD, passingYear: 2010, age: 36, previousTeam: 'Green House', basePrice: 75, stats: { appearances: 52, goals: 18, assists: 12 } },
  { name: 'Rui Costa', role: PlayerRole.FORWARD, passingYear: 2011, age: 35, previousTeam: 'Gold House', basePrice: 70, stats: { appearances: 45, goals: 15, assists: 8 } },
  { name: 'Karim Benzema', role: PlayerRole.FORWARD, passingYear: 2010, age: 36, previousTeam: 'Blue House', basePrice: 85, stats: { appearances: 55, goals: 28, assists: 9 } },
  { name: 'Thierry Henry', role: PlayerRole.FORWARD, passingYear: 2008, age: 38, previousTeam: 'Red House', basePrice: 90, stats: { appearances: 60, goals: 30, assists: 12 } },
  { name: 'Zinedine Zidane', role: PlayerRole.FORWARD, passingYear: 2006, age: 40, previousTeam: 'Green House', basePrice: 80, stats: { appearances: 55, goals: 25, assists: 10 } },
  { name: 'Gianluigi Buffon', role: PlayerRole.FORWARD, passingYear: 2008, age: 38, previousTeam: 'Gold House', basePrice: 70, stats: { appearances: 50, goals: 5, assists: 2 } },
  { name: 'Filippo Inzaghi', role: PlayerRole.FORWARD, passingYear: 2010, age: 36, previousTeam: 'Blue House', basePrice: 75, stats: { appearances: 45, goals: 20, assists: 4 } },
  { name: 'Roberto Lewandowski', role: PlayerRole.FORWARD, passingYear: 2011, age: 35, previousTeam: 'Red House', basePrice: 85, stats: { appearances: 52, goals: 32, assists: 7 } },
];

async function seedFreshPlayers(): Promise<void> {
  await connectDatabase();
  logger.info('Seeding 50 fresh players...');

  try {
    // 1. Get admin and teams
    const admin = await UserModel.findOne({ email: 'admin@playerauction.com' });
    if (!admin) throw new Error('Admin user not found. Run seed.ts first.');

    const teams = await TeamModel.find({});
    if (teams.length === 0) throw new Error('No teams found. Run seed.ts first.');

    // 2. Create 50 players
    const players = await PlayerModel.insertMany(
      FRESH_PLAYERS.map((seed) => ({
        ...seed,
        auctionStatus: PlayerAuctionStatus.PENDING,
        isRetained: false,
      }))
    );
    logger.info(`✓ Created ${players.length} fresh players`);

    // 3. Update auction — add all PENDING players to queue
    const auction = await AuctionModel.findOne({});
    if (auction) {
      await AuctionModel.findByIdAndUpdate(auction._id, {
        playerQueue: players.map((p) => p._id),
        status: AuctionStatus.DRAFT,
        currentPlayer: null,
        currentRound: 0,
        bidsOnCurrentPlayer: [],
      });
      logger.info(`✓ Updated auction with ${players.length} players in queue`);
    }

    logger.info('✓ Fresh player seed complete!');
    logger.info(`Ready to start auction with ${players.length} players`);
  } catch (err) {
    logger.error('Seed failed', { message: (err as any).message, stack: (err as any).stack });
    throw err;
  }

  await disconnectDatabase();
}

seedFreshPlayers().catch((err) => {
  logger.error('Script error', { message: (err as any).message });
  process.exit(1);
});
