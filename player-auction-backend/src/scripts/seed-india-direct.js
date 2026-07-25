/**
 * Direct MongoDB seed: 50 Indian players, 8 teams, 8 owners.
 * Run with: node src/scripts/seed-india-direct.js
 *
 * No TypeScript, no ts-node — plain Node.js + mongoose.
 */

// Override DNS to use Google's public DNS so Atlas SRV lookups work
// even when the local ISP/router DNS blocks them.
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set in .env');
  process.exit(1);
}

const SEASON = '2026';

// ── Schemas ──────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: 'ADMIN' },
}, { timestamps: true });

const RetentionEntrySchema = new mongoose.Schema({
  player: mongoose.Schema.Types.ObjectId,
  retentionPrice: Number,
  retentionOrder: Number,
  approvedBy: mongoose.Schema.Types.ObjectId,
  retainedAt: Date,
}, { _id: false });

const TeamSchema = new mongoose.Schema({
  name: String,
  shortName: String,
  primaryColor: String,
  secondaryColor: String,
  owner: mongoose.Schema.Types.ObjectId,
  totalBudget: Number,
  remainingBudget: Number,
  players: [mongoose.Schema.Types.ObjectId],
  retentions: [RetentionEntrySchema],
  season: String,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const OwnerSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, unique: true },
  name: String,
}, { timestamps: true });

const PlayerSchema = new mongoose.Schema({
  name: String,
  role: String,
  country: String,
  passingYear: Number,
  age: Number,
  previousTeam: String,
  basePrice: Number,
  stats: { appearances: Number, goals: Number, assists: Number },
  auctionStatus: { type: String, default: 'PENDING' },
  isRetained: { type: Boolean, default: false },
  soldTo: mongoose.Schema.Types.ObjectId,
  soldPrice: Number,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const AuctionSchema = new mongoose.Schema({
  name: String,
  status: { type: String, default: 'DRAFT' },
  playerQueue: [mongoose.Schema.Types.ObjectId],
  participatingTeams: [mongoose.Schema.Types.ObjectId],
  bidIncrementRules: [{ upTo: Number, increment: Number }],
  selectionMode: String,
  settings: mongoose.Schema.Types.Mixed,
  createdBy: mongoose.Schema.Types.ObjectId,
  currentPlayer: mongoose.Schema.Types.ObjectId,
  currentRound: { type: Number, default: 0 },
  bidsOnCurrentPlayer: { type: Array, default: [] },
}, { timestamps: true });

const BidSchema = new mongoose.Schema({
  player: mongoose.Schema.Types.ObjectId,
  team: mongoose.Schema.Types.ObjectId,
  amount: Number,
}, { timestamps: true });

const User   = mongoose.models.User   || mongoose.model('User',   UserSchema);
const Team   = mongoose.models.Team   || mongoose.model('Team',   TeamSchema);
const Owner  = mongoose.models.Owner  || mongoose.model('Owner',  OwnerSchema);
const Player = mongoose.models.Player || mongoose.model('Player', PlayerSchema);
const Auction = mongoose.models.Auction || mongoose.model('Auction', AuctionSchema);
const Bid    = mongoose.models.Bid    || mongoose.model('Bid',    BidSchema);

// ── Seed data ────────────────────────────────────────────────────────────────

const TEAM_SEEDS = [
  { name: 'Mumbai Mavericks',    shortName: 'MUM', primaryColor: '#1e3a8a', secondaryColor: '#fbbf24' },
  { name: 'Delhi Dynamos',       shortName: 'DEL', primaryColor: '#dc2626', secondaryColor: '#f8fafc' },
  { name: 'Bengaluru Blasters',  shortName: 'BLR', primaryColor: '#7c3aed', secondaryColor: '#f8fafc' },
  { name: 'Kolkata Knights',     shortName: 'KOL', primaryColor: '#854d0e', secondaryColor: '#fef9c3' },
  { name: 'Chennai Challengers', shortName: 'CHN', primaryColor: '#facc15', secondaryColor: '#1e293b' },
  { name: 'Hyderabad Heroes',    shortName: 'HYD', primaryColor: '#f97316', secondaryColor: '#1c1917' },
  { name: 'Punjab Panthers',     shortName: 'PUN', primaryColor: '#16a34a', secondaryColor: '#f8fafc' },
  { name: 'Rajasthan Royals',    shortName: 'RAJ', primaryColor: '#db2777', secondaryColor: '#f8fafc' },
];

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

const PLAYER_SEEDS = [
  // Goalkeepers (6)
  { name: 'Gurpreet Singh Sandhu',       role: 'GOALKEEPER', passingYear: 2010, age: 32, previousTeam: 'Blue House',  basePrice: 90, stats: { appearances: 68, goals: 0,  assists: 0  } },
  { name: 'Amrinder Singh',              role: 'GOALKEEPER', passingYear: 2013, age: 31, previousTeam: 'Red House',   basePrice: 70, stats: { appearances: 52, goals: 0,  assists: 0  } },
  { name: 'Vishal Kaith',                role: 'GOALKEEPER', passingYear: 2015, age: 30, previousTeam: 'Green House', basePrice: 65, stats: { appearances: 44, goals: 0,  assists: 0  } },
  { name: 'Dheeraj Singh Moirangthem',   role: 'GOALKEEPER', passingYear: 2016, age: 27, previousTeam: 'Gold House',  basePrice: 60, stats: { appearances: 36, goals: 0,  assists: 0  } },
  { name: 'Lalthuammawia Ralte',         role: 'GOALKEEPER', passingYear: 2012, age: 34, previousTeam: 'Blue House',  basePrice: 55, stats: { appearances: 48, goals: 0,  assists: 0  } },
  { name: 'Phurba Lachenpa',             role: 'GOALKEEPER', passingYear: 2014, age: 32, previousTeam: 'Red House',   basePrice: 50, stats: { appearances: 30, goals: 0,  assists: 0  } },

  // Defenders (14)
  { name: 'Sandesh Jhingan',             role: 'DEFENDER',   passingYear: 2012, age: 31, previousTeam: 'Green House', basePrice: 95, stats: { appearances: 82, goals: 5,  assists: 2  } },
  { name: 'Subhasish Bose',              role: 'DEFENDER',   passingYear: 2014, age: 30, previousTeam: 'Gold House',  basePrice: 80, stats: { appearances: 65, goals: 3,  assists: 1  } },
  { name: 'Pritam Kotal',                role: 'DEFENDER',   passingYear: 2011, age: 33, previousTeam: 'Blue House',  basePrice: 85, stats: { appearances: 70, goals: 2,  assists: 3  } },
  { name: 'Mandar Rao Dessai',           role: 'DEFENDER',   passingYear: 2013, age: 33, previousTeam: 'Red House',   basePrice: 75, stats: { appearances: 60, goals: 4,  assists: 2  } },
  { name: 'Narender Gehlot',             role: 'DEFENDER',   passingYear: 2015, age: 29, previousTeam: 'Green House', basePrice: 65, stats: { appearances: 44, goals: 0,  assists: 1  } },
  { name: 'Anas Edathodika',             role: 'DEFENDER',   passingYear: 2009, age: 36, previousTeam: 'Gold House',  basePrice: 60, stats: { appearances: 58, goals: 2,  assists: 0  } },
  { name: 'Rahul Bheke',                 role: 'DEFENDER',   passingYear: 2013, age: 33, previousTeam: 'Blue House',  basePrice: 72, stats: { appearances: 55, goals: 3,  assists: 1  } },
  { name: 'Seriton Fernandes',           role: 'DEFENDER',   passingYear: 2016, age: 28, previousTeam: 'Red House',   basePrice: 60, stats: { appearances: 38, goals: 0,  assists: 2  } },
  { name: 'Mehtab Singh',                role: 'DEFENDER',   passingYear: 2017, age: 25, previousTeam: 'Green House', basePrice: 55, stats: { appearances: 28, goals: 0,  assists: 0  } },
  { name: 'Roshan Singh',                role: 'DEFENDER',   passingYear: 2016, age: 27, previousTeam: 'Gold House',  basePrice: 50, stats: { appearances: 22, goals: 0,  assists: 0  } },
  { name: 'Chinglensana Singh',          role: 'DEFENDER',   passingYear: 2014, age: 30, previousTeam: 'Blue House',  basePrice: 58, stats: { appearances: 35, goals: 0,  assists: 1  } },
  { name: 'Akash Mishra',                role: 'DEFENDER',   passingYear: 2018, age: 24, previousTeam: 'Red House',   basePrice: 52, stats: { appearances: 20, goals: 0,  assists: 3  } },
  { name: 'Jerry Lalrinzuala',           role: 'DEFENDER',   passingYear: 2017, age: 26, previousTeam: 'Green House', basePrice: 55, stats: { appearances: 30, goals: 1,  assists: 0  } },
  { name: 'Asish Rai',                   role: 'DEFENDER',   passingYear: 2015, age: 29, previousTeam: 'Gold House',  basePrice: 62, stats: { appearances: 42, goals: 0,  assists: 0  } },

  // Midfielders (18)
  { name: 'Sunil Chhetri',               role: 'MIDFIELDER', passingYear: 2002, age: 39, previousTeam: 'Blue House',  basePrice: 100,stats: { appearances: 150,goals: 94, assists: 40 } },
  { name: 'Anirudh Thapa',               role: 'MIDFIELDER', passingYear: 2016, age: 26, previousTeam: 'Red House',   basePrice: 85, stats: { appearances: 58, goals: 8,  assists: 14 } },
  { name: 'Sahal Abdul Samad',           role: 'MIDFIELDER', passingYear: 2017, age: 26, previousTeam: 'Green House', basePrice: 82, stats: { appearances: 50, goals: 12, assists: 18 } },
  { name: 'Brandon Fernandes',           role: 'MIDFIELDER', passingYear: 2015, age: 28, previousTeam: 'Gold House',  basePrice: 80, stats: { appearances: 52, goals: 10, assists: 20 } },
  { name: 'Liston Colaco',               role: 'MIDFIELDER', passingYear: 2018, age: 24, previousTeam: 'Blue House',  basePrice: 78, stats: { appearances: 40, goals: 11, assists: 15 } },
  { name: 'Lalengmawia Ralte',           role: 'MIDFIELDER', passingYear: 2019, age: 22, previousTeam: 'Red House',   basePrice: 72, stats: { appearances: 35, goals: 5,  assists: 9  } },
  { name: 'Jeakson Singh Thounaojam',    role: 'MIDFIELDER', passingYear: 2017, age: 25, previousTeam: 'Green House', basePrice: 70, stats: { appearances: 38, goals: 4,  assists: 7  } },
  { name: 'Rowllin Borges',              role: 'MIDFIELDER', passingYear: 2014, age: 31, previousTeam: 'Gold House',  basePrice: 68, stats: { appearances: 55, goals: 6,  assists: 12 } },
  { name: 'Pronay Halder',               role: 'MIDFIELDER', passingYear: 2014, age: 32, previousTeam: 'Blue House',  basePrice: 65, stats: { appearances: 50, goals: 5,  assists: 8  } },
  { name: 'Amarjit Singh Kiyam',         role: 'MIDFIELDER', passingYear: 2018, age: 24, previousTeam: 'Red House',   basePrice: 62, stats: { appearances: 30, goals: 3,  assists: 6  } },
  { name: 'Bipin Singh',                 role: 'MIDFIELDER', passingYear: 2015, age: 28, previousTeam: 'Green House', basePrice: 75, stats: { appearances: 48, goals: 14, assists: 10 } },
  { name: 'Lallianzuala Chhangte',       role: 'MIDFIELDER', passingYear: 2017, age: 25, previousTeam: 'Gold House',  basePrice: 72, stats: { appearances: 44, goals: 13, assists: 8  } },
  { name: 'Naorem Mahesh Singh',         role: 'MIDFIELDER', passingYear: 2019, age: 22, previousTeam: 'Blue House',  basePrice: 60, stats: { appearances: 28, goals: 7,  assists: 5  } },
  { name: 'Vikram Pratap Singh',         role: 'MIDFIELDER', passingYear: 2020, age: 21, previousTeam: 'Red House',   basePrice: 58, stats: { appearances: 22, goals: 5,  assists: 4  } },
  { name: 'Suresh Singh Wangjam',        role: 'MIDFIELDER', passingYear: 2018, age: 24, previousTeam: 'Green House', basePrice: 60, stats: { appearances: 32, goals: 4,  assists: 7  } },
  { name: 'Komal Thatal',                role: 'MIDFIELDER', passingYear: 2017, age: 25, previousTeam: 'Gold House',  basePrice: 55, stats: { appearances: 28, goals: 6,  assists: 5  } },
  { name: 'Glan Martins',                role: 'MIDFIELDER', passingYear: 2016, age: 27, previousTeam: 'Blue House',  basePrice: 65, stats: { appearances: 40, goals: 5,  assists: 11 } },
  { name: 'Nikhil Poojary',              role: 'MIDFIELDER', passingYear: 2018, age: 25, previousTeam: 'Red House',   basePrice: 52, stats: { appearances: 24, goals: 3,  assists: 4  } },

  // Forwards (12)
  { name: 'Manvir Singh',                role: 'FORWARD',    passingYear: 2016, age: 27, previousTeam: 'Green House', basePrice: 90, stats: { appearances: 55, goals: 26, assists: 10 } },
  { name: 'Farukh Choudhary',            role: 'FORWARD',    passingYear: 2017, age: 26, previousTeam: 'Gold House',  basePrice: 85, stats: { appearances: 48, goals: 22, assists: 8  } },
  { name: 'Ishan Pandita',               role: 'FORWARD',    passingYear: 2018, age: 25, previousTeam: 'Blue House',  basePrice: 78, stats: { appearances: 38, goals: 18, assists: 6  } },
  { name: 'Rahim Ali',                   role: 'FORWARD',    passingYear: 2019, age: 22, previousTeam: 'Red House',   basePrice: 72, stats: { appearances: 30, goals: 14, assists: 4  } },
  { name: 'Lalrindika Ralte',            role: 'FORWARD',    passingYear: 2015, age: 28, previousTeam: 'Green House', basePrice: 70, stats: { appearances: 45, goals: 16, assists: 9  } },
  { name: 'Shilton Paul',                role: 'FORWARD',    passingYear: 2014, age: 30, previousTeam: 'Gold House',  basePrice: 65, stats: { appearances: 42, goals: 13, assists: 7  } },
  { name: 'Edmund Lalrindika',           role: 'FORWARD',    passingYear: 2016, age: 27, previousTeam: 'Blue House',  basePrice: 68, stats: { appearances: 40, goals: 15, assists: 5  } },
  { name: 'Ashique Kuruniyan',           role: 'FORWARD',    passingYear: 2017, age: 26, previousTeam: 'Red House',   basePrice: 80, stats: { appearances: 50, goals: 20, assists: 12 } },
  { name: 'Henry Kisekka',               role: 'FORWARD',    passingYear: 2015, age: 28, previousTeam: 'Green House', basePrice: 75, stats: { appearances: 44, goals: 19, assists: 7  } },
  { name: 'Vincy Barretto',              role: 'FORWARD',    passingYear: 2013, age: 32, previousTeam: 'Gold House',  basePrice: 65, stats: { appearances: 48, goals: 17, assists: 8  } },
  { name: 'Thoi Singh',                  role: 'FORWARD',    passingYear: 2018, age: 25, previousTeam: 'Blue House',  basePrice: 62, stats: { appearances: 28, goals: 11, assists: 4  } },
  { name: 'Shreyas Bhosale',             role: 'FORWARD',    passingYear: 2019, age: 23, previousTeam: 'Red House',   basePrice: 58, stats: { appearances: 22, goals: 9,  assists: 3  } },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!\n');

  // 1. Admin user
  let admin = await User.findOne({ email: 'admin@playerauction.com' });
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    admin = await User.create({ name: 'Admin', email: 'admin@playerauction.com', passwordHash, role: 'ADMIN' });
    console.log('✓ Created admin user');
  } else {
    console.log('✓ Admin user already exists');
  }

  // 2. Wipe existing data
  console.log('\nClearing existing data...');
  const existingPlayers = await Player.find({}).select('_id');
  const playerIds = existingPlayers.map(p => p._id);
  if (playerIds.length) await Bid.deleteMany({ player: { $in: playerIds } });
  await Auction.deleteMany({});
  await Player.deleteMany({});
  await Owner.deleteMany({});
  await Team.deleteMany({});
  console.log('✓ Cleared teams, owners, players, bids, auctions');

  // 3. Create 8 teams
  const teams = [];
  for (const seed of TEAM_SEEDS) {
    const team = await Team.create({
      ...seed,
      owner: admin._id,
      totalBudget: 1000,
      remainingBudget: 1000,
      players: [],
      retentions: [],
      season: SEASON,
      isDeleted: false,
    });
    teams.push(team);
  }
  console.log(`✓ Created ${teams.length} teams:`);
  teams.forEach(t => console.log(`    • ${t.name} (${t.shortName})`));

  // 4. Create 8 owners
  for (let i = 0; i < teams.length; i++) {
    await Owner.create({ team: teams[i]._id, name: OWNER_NAMES[i] });
  }
  console.log(`\n✓ Created ${OWNER_NAMES.length} owners:`);
  OWNER_NAMES.forEach((n, i) => console.log(`    • ${n}  →  ${teams[i].name}`));

  // 5. Create 50 Indian players
  const players = await Player.insertMany(
    PLAYER_SEEDS.map(seed => ({
      ...seed,
      country: 'India',
      auctionStatus: 'PENDING',
      isRetained: false,
    }))
  );
  console.log(`\n✓ Created ${players.length} Indian players`);

  // 6. Retain 2 players per team
  let idx = 0;
  for (const team of teams) {
    const toRetain = players.slice(idx, idx + 2);
    idx += 2;
    let order = 1;
    for (const player of toRetain) {
      const retentionPrice = Math.round(player.basePrice * 1.5);
      await Team.findByIdAndUpdate(team._id, {
        $push: {
          retentions: {
            player: player._id,
            retentionPrice,
            retentionOrder: order++,
            approvedBy: admin._id,
            retainedAt: new Date(),
          },
        },
        $addToSet: { players: player._id },
        $inc: { remainingBudget: -retentionPrice },
      });
      await Player.findByIdAndUpdate(player._id, {
        isRetained: true,
        auctionStatus: 'RETAINED',
        soldTo: team._id,
        soldPrice: retentionPrice,
      });
    }
  }
  console.log('✓ Retained 2 players per team (16 total)');

  // 7. Create auction
  const pendingPlayers = await Player.find({ auctionStatus: 'PENDING' });
  await Auction.create({
    name: 'India Premier Cup 2026 — Main Auction',
    status: 'DRAFT',
    playerQueue: pendingPlayers.map(p => p._id),
    participatingTeams: teams.map(t => t._id),
    bidIncrementRules: [
      { upTo: 100, increment: 5 },
      { upTo: 500, increment: 10 },
      { upTo: 1000, increment: 25 },
    ],
    selectionMode: 'SEQUENTIAL',
    settings: { autoAdvance: true },
    createdBy: admin._id,
    currentRound: 0,
    bidsOnCurrentPlayer: [],
  });
  console.log(`✓ Created auction with ${pendingPlayers.length} players in queue`);

  // ── Summary ──
  console.log('\n════════════════════════════════════════');
  console.log('  🎉  Seed complete!');
  console.log('════════════════════════════════════════');
  console.log(`  Teams   : ${teams.length}`);
  console.log(`  Owners  : ${OWNER_NAMES.length}`);
  console.log(`  Players : ${players.length}  (16 retained · ${pendingPlayers.length} in queue)`);
  console.log(`  Login   : admin@playerauction.com`);
  console.log(`  Password: Admin@12345`);
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
