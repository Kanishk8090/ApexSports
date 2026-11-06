const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Commencing Comprehensive Multi-Sport DB Seeding (Weeks 1-6) ---');

  // 1. Clean previous data
  await prisma.cricketDelivery.deleteMany();
  await prisma.cricketInnings.deleteMany();
  await prisma.footballMatchEvent.deleteMany();
  await prisma.footballLineup.deleteMany();
  await prisma.footballMatchStat.deleteMany();
  await prisma.score.deleteMany();
  await prisma.result.deleteMany();
  await prisma.matchTeam.deleteMany();
  await prisma.match.deleteMany();
  await prisma.standing.deleteMany();
  await prisma.tournamentTeam.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.teamPlayer.deleteMany();
  await prisma.team.deleteMany();
  await prisma.player.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.sport.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const organizerPassword = await bcrypt.hash('organizer123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@sports.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const organizer = await prisma.user.create({
    data: {
      name: 'Elena Vance (Organizer)',
      email: 'organizer@sports.com',
      passwordHash: organizerPassword,
      role: 'ORGANIZER',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Fan Spectator',
      email: 'user@sports.com',
      passwordHash: userPassword,
      role: 'USER',
    },
  });

  console.log('✅ Base user accounts created (Admin, Organizer, Fan)');

  // 3. Create 6 Core Sports
  const sportsData = [
    { name: 'Football', code: 'FTB', description: 'Association Football (11v11) with 90-minute regulation time and league standings' },
    { name: 'Cricket', code: 'CRK', description: 'T20 & One Day International cricket formats with runs, wickets, and overs' },
    { name: 'Basketball', code: 'BSK', description: 'Full-court 5v5 basketball with 4 quarters, shot clock, and high-intensity scoring' },
    { name: 'Tennis', code: 'TNS', description: 'Singles and doubles lawn tennis played across sets and tiebreakers' },
    { name: 'Badminton', code: 'BDM', description: 'High-speed racket sport played to 21 rally points across sets' },
    { name: 'Volleyball', code: 'VLB', description: 'Team volleyball played with 6 players per side across 3 to 5 sets' },
  ];

  const sportsMap = {};
  for (const s of sportsData) {
    const created = await prisma.sport.create({ data: s });
    sportsMap[s.code] = created;
  }
  console.log(`✅ Seeded ${sportsData.length} core sports`);

  // 4. Create 10+ Venues
  const venuesData = [
    { name: 'Apex Arena Stadium', location: 'London, UK', capacity: 62000, description: 'Premier multi-tier modern grass pitch stadium' },
    { name: 'Stamford Metro Complex', location: 'Manchester, UK', capacity: 45000, description: 'World-class grass football venue' },
    { name: 'Eden Oval Ground', location: 'Kolkata, IN', capacity: 68000, description: 'Historic international cricket ground' },
    { name: 'Melbourne Cricket Hub', location: 'Melbourne, AU', capacity: 90000, description: 'Iconic cricket colosseum' },
    { name: 'United Center Court', location: 'Chicago, USA', capacity: 21000, description: 'State-of-the-art indoor basketball court' },
    { name: 'Barclays Hardwood Pavilion', location: 'New York, USA', capacity: 19000, description: 'Championship-grade basketball arena' },
    { name: 'Roland Centre Court', location: 'Paris, France', capacity: 15000, description: 'Championship clay and hard tennis court' },
    { name: 'Wimbledon All-England Arena', location: 'London, UK', capacity: 14500, description: 'Iconic grass court stadium' },
    { name: 'Tokyo Indoor Sports Dome', location: 'Tokyo, Japan', capacity: 12000, description: 'High-tech badminton and volleyball complex' },
    { name: 'Olympic Park Volley Hall', location: 'Rio de Janeiro, Brazil', capacity: 11000, description: 'Olympic standard indoor volleyball facility' },
  ];

  const venues = [];
  for (const v of venuesData) {
    venues.push(await prisma.venue.create({ data: v }));
  }
  console.log(`✅ Seeded ${venues.length} venues`);

  // 5. Create Teams and Players across sports
  // Football Teams
  const footballTeamsData = [
    { name: 'London Knights FC', code: 'FTB', desc: 'Capital city contenders known for attacking football' },
    { name: 'Madrid Galacticos', code: 'FTB', desc: 'European heavyweights with high possession style' },
    { name: 'Bavaria Dynamos', code: 'FTB', desc: 'Disciplined and ruthless pressing machine' },
    { name: 'Milan Rossoneri', code: 'FTB', desc: 'Tactical powerhouse with defensive mastery' },
  ];

  // Cricket Teams
  const cricketTeamsData = [
    { name: 'Mumbai Titans', code: 'CRK', desc: 'Power hitters with formidable pace attack' },
    { name: 'Sydney Strikers', code: 'CRK', desc: 'Aggressive top order and athletic fielders' },
    { name: 'Karachi Falcons', code: 'CRK', desc: 'Raw reverse-swing fast bowlers and explosive all-rounders' },
    { name: 'Bengaluru Royals', code: 'CRK', desc: 'Dynamic spin bowling lineup and chase specialists' },
  ];

  // Basketball Teams
  const basketballTeamsData = [
    { name: 'Golden State Vipers', code: 'BSK', desc: 'Fast-paced transition offense and perimeter shooting' },
    { name: 'Boston Celtics Pride', code: 'BSK', desc: 'Tough defensive unit with clinical pick-and-roll' },
    { name: 'LA Showstoppers', code: 'BSK', desc: 'Star-studded fast-break squad with rim protection' },
    { name: 'Miami Heatwave', code: 'BSK', desc: 'Relentless conditioning and clutch late-game execution' },
  ];

  // Tennis Teams/Players
  const tennisTeamsData = [
    { name: 'Vanguard Tennis Academy', code: 'TNS', desc: 'Elite professional training stable' },
    { name: 'Alpine Tennis Club', code: 'TNS', desc: 'Swiss-Austrian grass and clay masters' },
  ];

  // Badminton Teams
  const badmintonTeamsData = [
    { name: 'Seoul Shuttlers', code: 'BDM', desc: 'Korean national training contingent' },
    { name: 'Jakarta Smashers', code: 'BDM', desc: 'Fast rally and drop shot masters' },
  ];

  // Volleyball Teams
  const volleyballTeamsData = [
    { name: 'Copacabana Spikers', code: 'VLB', desc: 'Brazilian high-flying blocking unit' },
    { name: 'Rome Gladiators Volley', code: 'VLB', desc: 'Italian league power servers' },
  ];

  const allTeamsData = [
    ...footballTeamsData,
    ...cricketTeamsData,
    ...basketballTeamsData,
    ...tennisTeamsData,
    ...badmintonTeamsData,
    ...volleyballTeamsData,
  ];

  const teams = [];
  for (const t of allTeamsData) {
    const created = await prisma.team.create({
      data: {
        name: t.name,
        sportId: sportsMap[t.code].id,
        description: t.desc,
      },
    });
    teams.push(created);
  }
  console.log(`✅ Seeded ${teams.length} teams across all 6 sports`);

  // 6. Create 50+ Players and assign to Team Rosters
  const playersRosterSeed = [
    // Football Players (London Knights)
    { name: 'Marcus Sterling', sport: 'FTB', nat: 'England', gen: 'Male', team: 'London Knights FC', num: 9 },
    { name: 'Julian Alvarez', sport: 'FTB', nat: 'Argentina', gen: 'Male', team: 'London Knights FC', num: 10 },
    { name: 'Declan Cole', sport: 'FTB', nat: 'England', gen: 'Male', team: 'London Knights FC', num: 4 },
    { name: 'Aaron Ramsgate', sport: 'FTB', nat: 'England', gen: 'Male', team: 'London Knights FC', num: 1 },
    // Football Players (Madrid Galacticos)
    { name: 'Luka Modric', sport: 'FTB', nat: 'Croatia', gen: 'Male', team: 'Madrid Galacticos', num: 10 },
    { name: 'Vinicius Silva', sport: 'FTB', nat: 'Brazil', gen: 'Male', team: 'Madrid Galacticos', num: 7 },
    { name: 'Jude Bell', sport: 'FTB', nat: 'England', gen: 'Male', team: 'Madrid Galacticos', num: 5 },
    { name: 'Thibaut Courtois', sport: 'FTB', nat: 'Belgium', gen: 'Male', team: 'Madrid Galacticos', num: 1 },
    // Football Players (Bavaria Dynamos)
    { name: 'Harry King', sport: 'FTB', nat: 'England', gen: 'Male', team: 'Bavaria Dynamos', num: 9 },
    { name: 'Jamal Musiala', sport: 'FTB', nat: 'Germany', gen: 'Male', team: 'Bavaria Dynamos', num: 42 },
    { name: 'Joshua Kimmich', sport: 'FTB', nat: 'Germany', gen: 'Male', team: 'Bavaria Dynamos', num: 6 },
    { name: 'Manuel Neuer', sport: 'FTB', nat: 'Germany', gen: 'Male', team: 'Bavaria Dynamos', num: 1 },
    // Football Players (Milan Rossoneri)
    { name: 'Rafael Leao', sport: 'FTB', nat: 'Portugal', gen: 'Male', team: 'Milan Rossoneri', num: 10 },
    { name: 'Theo Hernandez', sport: 'FTB', nat: 'France', gen: 'Male', team: 'Milan Rossoneri', num: 19 },
    { name: 'Christian Pulisic', sport: 'FTB', nat: 'USA', gen: 'Male', team: 'Milan Rossoneri', num: 11 },
    { name: 'Mike Maignan', sport: 'FTB', nat: 'France', gen: 'Male', team: 'Milan Rossoneri', num: 16 },

    // Cricket Players (Mumbai Titans)
    { name: 'Rohit Sharma', sport: 'CRK', nat: 'India', gen: 'Male', team: 'Mumbai Titans', num: 45 },
    { name: 'Jasprit Bumrah', sport: 'CRK', nat: 'India', gen: 'Male', team: 'Mumbai Titans', num: 93 },
    { name: 'Suryakumar Yadav', sport: 'CRK', nat: 'India', gen: 'Male', team: 'Mumbai Titans', num: 63 },
    { name: 'Hardik Pandya', sport: 'CRK', nat: 'India', gen: 'Male', team: 'Mumbai Titans', num: 33 },
    // Cricket Players (Sydney Strikers)
    { name: 'Pat Cummins', sport: 'CRK', nat: 'Australia', gen: 'Male', team: 'Sydney Strikers', num: 30 },
    { name: 'Travis Head', sport: 'CRK', nat: 'Australia', gen: 'Male', team: 'Sydney Strikers', num: 62 },
    { name: 'Glenn Maxwell', sport: 'CRK', nat: 'Australia', gen: 'Male', team: 'Sydney Strikers', num: 32 },
    { name: 'Mitchell Starc', sport: 'CRK', nat: 'Australia', gen: 'Male', team: 'Sydney Strikers', num: 56 },
    // Cricket Players (Karachi Falcons)
    { name: 'Babar Azam', sport: 'CRK', nat: 'Pakistan', gen: 'Male', team: 'Karachi Falcons', num: 56 },
    { name: 'Shaheen Afridi', sport: 'CRK', nat: 'Pakistan', gen: 'Male', team: 'Karachi Falcons', num: 10 },
    { name: 'Mohammad Rizwan', sport: 'CRK', nat: 'Pakistan', gen: 'Male', team: 'Karachi Falcons', num: 16 },
    { name: 'Naseem Shah', sport: 'CRK', nat: 'Pakistan', gen: 'Male', team: 'Karachi Falcons', num: 71 },
    // Cricket Players (Bengaluru Royals)
    { name: 'Virat Kohli', sport: 'CRK', nat: 'India', gen: 'Male', team: 'Bengaluru Royals', num: 18 },
    { name: 'Faf du Plessis', sport: 'CRK', nat: 'South Africa', gen: 'Male', team: 'Bengaluru Royals', num: 13 },
    { name: 'Mohammed Siraj', sport: 'CRK', nat: 'India', gen: 'Male', team: 'Bengaluru Royals', num: 73 },
    { name: 'Rajat Patidar', sport: 'CRK', nat: 'India', gen: 'Male', team: 'Bengaluru Royals', num: 97 },

    // Basketball Players (Golden State Vipers)
    { name: 'Stephen Curry', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Golden State Vipers', num: 30 },
    { name: 'Klay Thompson', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Golden State Vipers', num: 11 },
    { name: 'Draymond Green', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Golden State Vipers', num: 23 },
    { name: 'Andrew Wiggins', sport: 'BSK', nat: 'Canada', gen: 'Male', team: 'Golden State Vipers', num: 22 },
    // Basketball Players (Boston Celtics Pride)
    { name: 'Jayson Tatum', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Boston Celtics Pride', num: 0 },
    { name: 'Jaylen Brown', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Boston Celtics Pride', num: 7 },
    { name: 'Derrick White', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Boston Celtics Pride', num: 9 },
    { name: 'Kristaps Porzingis', sport: 'BSK', nat: 'Latvia', gen: 'Male', team: 'Boston Celtics Pride', num: 8 },
    // Basketball Players (LA Showstoppers)
    { name: 'LeBron James', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'LA Showstoppers', num: 23 },
    { name: 'Anthony Davis', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'LA Showstoppers', num: 3 },
    { name: 'Austin Reaves', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'LA Showstoppers', num: 15 },
    { name: 'D’Angelo Russell', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'LA Showstoppers', num: 1 },
    // Basketball Players (Miami Heatwave)
    { name: 'Jimmy Butler', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Miami Heatwave', num: 22 },
    { name: 'Bam Adebayo', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Miami Heatwave', num: 13 },
    { name: 'Tyler Herro', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Miami Heatwave', num: 14 },
    { name: 'Duncan Robinson', sport: 'BSK', nat: 'USA', gen: 'Male', team: 'Miami Heatwave', num: 55 },

    // Tennis Players
    { name: 'Carlos Alcaraz', sport: 'TNS', nat: 'Spain', gen: 'Male', team: 'Vanguard Tennis Academy', num: 1 },
    { name: 'Jannik Sinner', sport: 'TNS', nat: 'Italy', gen: 'Male', team: 'Vanguard Tennis Academy', num: 2 },
    { name: 'Novak Djokovic', sport: 'TNS', nat: 'Serbia', gen: 'Male', team: 'Alpine Tennis Club', num: 1 },
    { name: 'Alexander Zverev', sport: 'TNS', nat: 'Germany', gen: 'Male', team: 'Alpine Tennis Club', num: 4 },

    // Badminton Players
    { name: 'An Se-young', sport: 'BDM', nat: 'South Korea', gen: 'Female', team: 'Seoul Shuttlers', num: 1 },
    { name: 'Viktor Axelsen', sport: 'BDM', nat: 'Denmark', gen: 'Male', team: 'Seoul Shuttlers', num: 1 },
    { name: 'Anthony Ginting', sport: 'BDM', nat: 'Indonesia', gen: 'Male', team: 'Jakarta Smashers', num: 8 },
    { name: 'Jonatan Christie', sport: 'BDM', nat: 'Indonesia', gen: 'Male', team: 'Jakarta Smashers', num: 7 },

    // Volleyball Players
    { name: 'Wallace de Souza', sport: 'VLB', nat: 'Brazil', gen: 'Male', team: 'Copacabana Spikers', num: 8 },
    { name: 'Bruninho Rezende', sport: 'VLB', nat: 'Brazil', gen: 'Male', team: 'Copacabana Spikers', num: 1 },
    { name: 'Simone Giannelli', sport: 'VLB', nat: 'Italy', gen: 'Male', team: 'Rome Gladiators Volley', num: 6 },
    { name: 'Ivan Zaytsev', sport: 'VLB', nat: 'Italy', gen: 'Male', team: 'Rome Gladiators Volley', num: 9 },
  ];

  const createdPlayersMap = {};
  for (const p of playersRosterSeed) {
    const playerRecord = await prisma.player.create({
      data: {
        name: p.name,
        sportId: sportsMap[p.sport].id,
        nationality: p.nat,
        gender: p.gen,
      },
    });
    createdPlayersMap[p.name] = playerRecord;

    const teamRecord = teams.find((t) => t.name === p.team);
    if (teamRecord) {
      await prisma.teamPlayer.create({
        data: {
          teamId: teamRecord.id,
          playerId: playerRecord.id,
          jerseyNumber: p.num,
        },
      });
    }
  }
  console.log(`✅ Seeded ${Object.keys(createdPlayersMap).length} players with assigned team rosters`);

  // 7. Seed Tournaments across sports
  // Tournament 1: Premier Champions League (Football - LEAGUE)
  const ftbTourney = await prisma.tournament.create({
    data: {
      name: 'Premier Champions League 2026',
      sportId: sportsMap['FTB'].id,
      description: 'The definitive European club football tournament with round-robin fixtures and automatic standings points',
      startDate: new Date('2026-11-01T10:00:00Z'),
      endDate: new Date('2026-12-15T22:00:00Z'),
      format: 'LEAGUE',
      status: 'ONGOING',
      createdBy: organizer.id,
    },
  });

  // Tournament 2: Global T20 Cricket Trophy (Cricket - LEAGUE)
  const crkTourney = await prisma.tournament.create({
    data: {
      name: 'Global T20 Cricket Trophy',
      sportId: sportsMap['CRK'].id,
      description: 'High-octane T20 cricket tournament featuring world-class international franchises',
      startDate: new Date('2026-11-05T08:30:00Z'),
      endDate: new Date('2026-12-01T18:00:00Z'),
      format: 'LEAGUE',
      status: 'ONGOING',
      createdBy: organizer.id,
    },
  });

  // Tournament 3: Metro Basketball Championship (Basketball - KNOCKOUT)
  const bskTourney = await prisma.tournament.create({
    data: {
      name: 'Metro Basketball Cup 2026',
      sportId: sportsMap['BSK'].id,
      description: 'Single-elimination championship bracket pitting elite basketball franchises',
      startDate: new Date('2026-11-10T14:00:00Z'),
      endDate: new Date('2026-11-28T21:00:00Z'),
      format: 'KNOCKOUT',
      status: 'UPCOMING',
      createdBy: organizer.id,
    },
  });

  console.log('✅ Created 3 flagship tournaments (Football, Cricket, Basketball)');

  // 8. Register Teams to Tournaments
  // Register Football teams
  const ftbTeams = teams.filter((t) => t.sportId === sportsMap['FTB'].id);
  for (let i = 0; i < ftbTeams.length; i++) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: ftbTourney.id,
        teamId: ftbTeams[i].id,
        seed: i + 1,
      },
    });
  }

  // Register Cricket teams
  const crkTeams = teams.filter((t) => t.sportId === sportsMap['CRK'].id);
  for (let i = 0; i < crkTeams.length; i++) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: crkTourney.id,
        teamId: crkTeams[i].id,
        seed: i + 1,
      },
    });
  }

  // Register Basketball teams
  const bskTeams = teams.filter((t) => t.sportId === sportsMap['BSK'].id);
  for (let i = 0; i < bskTeams.length; i++) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: bskTourney.id,
        teamId: bskTeams[i].id,
        seed: i + 1,
      },
    });
  }

  console.log('✅ Registered teams to corresponding tournaments');

  // 9. Generate Matches, Scores, Results & Standings for Football Tournament
  // Match 1: London Knights FC vs Madrid Galacticos (Completed: 3 - 1)
  const m1 = await prisma.match.create({
    data: {
      tournamentId: ftbTourney.id,
      venueId: venues[0].id,
      round: 1,
      matchNumber: 1,
      scheduledAt: new Date('2026-11-01T15:00:00Z'),
      status: 'COMPLETED',
      matchTeams: {
        create: [
          { teamId: ftbTeams[0].id, side: 'HOME' },
          { teamId: ftbTeams[1].id, side: 'AWAY' },
        ],
      },
      scores: {
        create: [
          { teamId: ftbTeams[0].id, scoreValue: 3, period: 'Full Time', details: 'Marcus Sterling 14\', Julian Alvarez 68\', 82\'' },
          { teamId: ftbTeams[1].id, scoreValue: 1, period: 'Full Time', details: 'Vinicius Silva 54\'' },
        ],
      },
      result: {
        create: {
          winnerTeamId: ftbTeams[0].id,
          resultType: 'WIN',
        },
      },
    },
  });

  // Lineups for Football Match 1
  await prisma.footballLineup.createMany({
    data: [
      { matchId: m1.id, teamId: ftbTeams[0].id, playerId: createdPlayersMap['Aaron Ramsgate'].id, isStarting: true, position: 'GK', jerseyNumber: 1 },
      { matchId: m1.id, teamId: ftbTeams[0].id, playerId: createdPlayersMap['Declan Cole'].id, isStarting: true, position: 'MID', jerseyNumber: 4, isCaptain: true },
      { matchId: m1.id, teamId: ftbTeams[0].id, playerId: createdPlayersMap['Marcus Sterling'].id, isStarting: true, position: 'FWD', jerseyNumber: 7 },
      { matchId: m1.id, teamId: ftbTeams[0].id, playerId: createdPlayersMap['Julian Alvarez'].id, isStarting: true, position: 'FWD', jerseyNumber: 9 },
      { matchId: m1.id, teamId: ftbTeams[1].id, playerId: createdPlayersMap['Thibaut Courtois'].id, isStarting: true, position: 'GK', jerseyNumber: 1 },
      { matchId: m1.id, teamId: ftbTeams[1].id, playerId: createdPlayersMap['Jude Bell'].id, isStarting: true, position: 'MID', jerseyNumber: 5 },
      { matchId: m1.id, teamId: ftbTeams[1].id, playerId: createdPlayersMap['Luka Modric'].id, isStarting: true, position: 'MID', jerseyNumber: 10, isCaptain: true },
      { matchId: m1.id, teamId: ftbTeams[1].id, playerId: createdPlayersMap['Vinicius Silva'].id, isStarting: true, position: 'FWD', jerseyNumber: 7 },
    ],
  });

  // Events for Football Match 1
  await prisma.footballMatchEvent.createMany({
    data: [
      { matchId: m1.id, teamId: ftbTeams[0].id, eventType: 'PERIOD_START', minute: 1, period: '1H', description: 'Kickoff! London Knights get the match underway.' },
      { matchId: m1.id, teamId: ftbTeams[0].id, eventType: 'GOAL', minute: 14, period: '1H', primaryPlayerId: createdPlayersMap['Marcus Sterling'].id, secondaryPlayerId: createdPlayersMap['Julian Alvarez'].id, goalType: 'REGULAR', description: 'GOAL! Marcus Sterling slots it into the bottom corner after a fine pass from Alvarez!' },
      { matchId: m1.id, teamId: ftbTeams[1].id, eventType: 'YELLOW_CARD', minute: 34, period: '1H', primaryPlayerId: createdPlayersMap['Jude Bell'].id, cardReason: 'Late tackle on Declan Cole', description: 'Yellow card for Jude Bell following a tactical foul.' },
      { matchId: m1.id, teamId: ftbTeams[0].id, eventType: 'PERIOD_END', minute: 45, period: 'HT', description: 'Half-time whistle blows. London Knights lead 1-0.' },
      { matchId: m1.id, teamId: ftbTeams[1].id, eventType: 'PERIOD_START', minute: 46, period: '2H', description: 'Second half commences.' },
      { matchId: m1.id, teamId: ftbTeams[1].id, eventType: 'GOAL', minute: 54, period: '2H', primaryPlayerId: createdPlayersMap['Vinicius Silva'].id, secondaryPlayerId: createdPlayersMap['Luka Modric'].id, goalType: 'REGULAR', description: 'GOAL! Vinicius Silva levels the score with a breathtaking solo run and curled strike!' },
      { matchId: m1.id, teamId: ftbTeams[0].id, eventType: 'GOAL', minute: 68, period: '2H', primaryPlayerId: createdPlayersMap['Julian Alvarez'].id, secondaryPlayerId: createdPlayersMap['Marcus Sterling'].id, goalType: 'REGULAR', description: 'GOAL! Julian Alvarez restores the lead with a clinical header!' },
      { matchId: m1.id, teamId: ftbTeams[0].id, eventType: 'GOAL', minute: 82, period: '2H', primaryPlayerId: createdPlayersMap['Julian Alvarez'].id, goalType: 'PENALTY', description: 'GOAL! Alvarez makes no mistake from the penalty spot, sending Courtois the wrong way!' },
      { matchId: m1.id, teamId: ftbTeams[0].id, eventType: 'PERIOD_END', minute: 90, addedTime: 3, period: 'FT', description: 'Full-time! London Knights secure a 3-1 victory.' },
    ],
  });

  // Statistics for Football Match 1
  await prisma.footballMatchStat.createMany({
    data: [
      { matchId: m1.id, teamId: ftbTeams[0].id, possession: 55, shots: 15, shotsOnTarget: 8, corners: 6, fouls: 8, yellowCards: 0, redCards: 0, offsides: 2, saves: 3 },
      { matchId: m1.id, teamId: ftbTeams[1].id, possession: 45, shots: 9, shotsOnTarget: 4, corners: 4, fouls: 11, yellowCards: 1, redCards: 0, offsides: 1, saves: 5 },
    ],
  });

  // Match 2: Bavaria Dynamos vs Milan Rossoneri (Completed: 2 - 2)
  const m2 = await prisma.match.create({
    data: {
      tournamentId: ftbTourney.id,
      venueId: venues[1].id,
      round: 1,
      matchNumber: 2,
      scheduledAt: new Date('2026-11-02T18:00:00Z'),
      status: 'COMPLETED',
      matchTeams: {
        create: [
          { teamId: ftbTeams[2].id, side: 'HOME' },
          { teamId: ftbTeams[3].id, side: 'AWAY' },
        ],
      },
      scores: {
        create: [
          { teamId: ftbTeams[2].id, scoreValue: 2, period: 'Full Time', details: 'Harry King 22\', Jamal Musiala 77\'' },
          { teamId: ftbTeams[3].id, scoreValue: 2, period: 'Full Time', details: 'Rafael Leao 41\', Christian Pulisic 89\'' },
        ],
      },
      result: {
        create: {
          winnerTeamId: null,
          resultType: 'DRAW',
        },
      },
    },
  });

  // Match 3: London Knights FC vs Bavaria Dynamos (Completed: 1 - 0)
  const m3 = await prisma.match.create({
    data: {
      tournamentId: ftbTourney.id,
      venueId: venues[0].id,
      round: 2,
      matchNumber: 3,
      scheduledAt: new Date('2026-11-06T15:00:00Z'),
      status: 'COMPLETED',
      matchTeams: {
        create: [
          { teamId: ftbTeams[0].id, side: 'HOME' },
          { teamId: ftbTeams[2].id, side: 'AWAY' },
        ],
      },
      scores: {
        create: [
          { teamId: ftbTeams[0].id, scoreValue: 1, period: 'Full Time', details: 'Marcus Sterling 63\'' },
          { teamId: ftbTeams[2].id, scoreValue: 0, period: 'Full Time', details: 'Clean sheet defense' },
        ],
      },
      result: {
        create: {
          winnerTeamId: ftbTeams[0].id,
          resultType: 'WIN',
        },
      },
    },
  });

  // Upcoming Football Matches
  await prisma.match.create({
    data: {
      tournamentId: ftbTourney.id,
      venueId: venues[1].id,
      round: 2,
      matchNumber: 4,
      scheduledAt: new Date('2026-11-12T19:00:00Z'),
      status: 'SCHEDULED',
      matchTeams: {
        create: [
          { teamId: ftbTeams[1].id, side: 'HOME' },
          { teamId: ftbTeams[3].id, side: 'AWAY' },
        ],
      },
    },
  });

  await prisma.match.create({
    data: {
      tournamentId: ftbTourney.id,
      venueId: venues[0].id,
      round: 3,
      matchNumber: 5,
      scheduledAt: new Date('2026-11-18T16:00:00Z'),
      status: 'SCHEDULED',
      matchTeams: {
        create: [
          { teamId: ftbTeams[0].id, side: 'HOME' },
          { teamId: ftbTeams[3].id, side: 'AWAY' },
        ],
      },
    },
  });

  // 10. Generate Standings for Football League
  await prisma.standing.createMany({
    data: [
      {
        tournamentId: ftbTourney.id,
        teamId: ftbTeams[0].id,
        played: 2,
        wins: 2,
        draws: 0,
        losses: 0,
        goalsFor: 4,
        goalsAgainst: 1,
        scoreDifference: 3,
        points: 6,
        rank: 1,
      },
      {
        tournamentId: ftbTourney.id,
        teamId: ftbTeams[3].id,
        played: 1,
        wins: 0,
        draws: 1,
        losses: 0,
        goalsFor: 2,
        goalsAgainst: 2,
        scoreDifference: 0,
        points: 1,
        rank: 2,
      },
      {
        tournamentId: ftbTourney.id,
        teamId: ftbTeams[2].id,
        played: 2,
        wins: 0,
        draws: 1,
        losses: 1,
        goalsFor: 2,
        goalsAgainst: 3,
        scoreDifference: -1,
        points: 1,
        rank: 3,
      },
      {
        tournamentId: ftbTourney.id,
        teamId: ftbTeams[1].id,
        played: 1,
        wins: 0,
        draws: 0,
        losses: 1,
        goalsFor: 1,
        goalsAgainst: 3,
        scoreDifference: -2,
        points: 0,
        rank: 4,
      },
    ],
  });

  // 11. Seed Cricket Matches & Standings
  // Cricket Match 1: Mumbai Titans vs Sydney Strikers (Completed: 188 - 182)
  const crkM1 = await prisma.match.create({
    data: {
      tournamentId: crkTourney.id,
      venueId: venues[2].id,
      round: 1,
      matchNumber: 1,
      scheduledAt: new Date('2026-11-05T09:00:00Z'),
      status: 'COMPLETED',
      matchTeams: {
        create: [
          { teamId: crkTeams[0].id, side: 'HOME' },
          { teamId: crkTeams[1].id, side: 'AWAY' },
        ],
      },
      scores: {
        create: [
          { teamId: crkTeams[0].id, scoreValue: 188, period: '20 Overs', details: '188/4 in 20.0 ov (Suryakumar 74 off 38)' },
          { teamId: crkTeams[1].id, scoreValue: 182, period: '20 Overs', details: '182/8 in 20.0 ov (Travis Head 61 off 32)' },
        ],
      },
      result: {
        create: {
          winnerTeamId: crkTeams[0].id,
          resultType: 'WIN',
        },
      },
    },
  });

  // Cricket Innings 1 (Mumbai Titans)
  const inn1 = await prisma.cricketInnings.create({
    data: {
      matchId: crkM1.id,
      inningsNumber: 1,
      battingTeamId: crkTeams[0].id,
      bowlingTeamId: crkTeams[1].id,
      totalRuns: 188,
      totalWickets: 4,
      totalLegalBalls: 120,
      oversLimit: 20,
      isCompleted: true,
      byes: 2,
      legByes: 3,
      wides: 5,
      noBalls: 1,
    },
  });

  // Cricket Innings 2 (Sydney Strikers)
  const inn2 = await prisma.cricketInnings.create({
    data: {
      matchId: crkM1.id,
      inningsNumber: 2,
      battingTeamId: crkTeams[1].id,
      bowlingTeamId: crkTeams[0].id,
      totalRuns: 182,
      totalWickets: 8,
      totalLegalBalls: 120,
      oversLimit: 20,
      targetRuns: 189,
      isCompleted: true,
      byes: 1,
      legByes: 2,
      wides: 4,
      noBalls: 2,
    },
  });

  // Sample deliveries for Innings 1
  await prisma.cricketDelivery.createMany({
    data: [
      { inningsId: inn1.id, overNumber: 0, ballInOver: 1, legalBallNumber: 1, bowlerId: createdPlayersMap['Pat Cummins'].id, strikerId: createdPlayersMap['Rohit Sharma'].id, nonStrikerId: createdPlayersMap['Suryakumar Yadav'].id, runs: 4, commentary: 'FOUR! Rohit Sharma leans into a gorgeous cover drive off Cummins!' },
      { inningsId: inn1.id, overNumber: 0, ballInOver: 2, legalBallNumber: 2, bowlerId: createdPlayersMap['Pat Cummins'].id, strikerId: createdPlayersMap['Rohit Sharma'].id, nonStrikerId: createdPlayersMap['Suryakumar Yadav'].id, runs: 0, commentary: 'Good length ball outside off, defended safely to point.' },
      { inningsId: inn1.id, overNumber: 0, ballInOver: 3, legalBallNumber: 3, bowlerId: createdPlayersMap['Pat Cummins'].id, strikerId: createdPlayersMap['Rohit Sharma'].id, nonStrikerId: createdPlayersMap['Suryakumar Yadav'].id, runs: 1, commentary: 'Tucked off the hips towards deep square leg for a single.' },
      { inningsId: inn1.id, overNumber: 0, ballInOver: 4, legalBallNumber: 4, bowlerId: createdPlayersMap['Pat Cummins'].id, strikerId: createdPlayersMap['Suryakumar Yadav'].id, nonStrikerId: createdPlayersMap['Rohit Sharma'].id, runs: 6, commentary: 'SIX! SKY special! Scooped high over fine leg for maximum!' },
      { inningsId: inn1.id, overNumber: 0, ballInOver: 5, legalBallNumber: 5, bowlerId: createdPlayersMap['Pat Cummins'].id, strikerId: createdPlayersMap['Suryakumar Yadav'].id, nonStrikerId: createdPlayersMap['Rohit Sharma'].id, runs: 2, commentary: 'Pushed into the gap at deep midwicket, sharp running between the wickets.' },
      { inningsId: inn1.id, overNumber: 0, ballInOver: 6, legalBallNumber: 6, bowlerId: createdPlayersMap['Pat Cummins'].id, strikerId: createdPlayersMap['Suryakumar Yadav'].id, nonStrikerId: createdPlayersMap['Rohit Sharma'].id, runs: 1, commentary: 'Single to third man. End of over 1: Mumbai Titans 14/0.' },
      { inningsId: inn1.id, overNumber: 1, ballInOver: 1, legalBallNumber: 7, bowlerId: createdPlayersMap['Mitchell Starc'].id, strikerId: createdPlayersMap['Rohit Sharma'].id, nonStrikerId: createdPlayersMap['Suryakumar Yadav'].id, isWicket: true, wicketType: 'BOWLED', dismissedPlayerId: createdPlayersMap['Rohit Sharma'].id, runs: 0, commentary: 'OUT! Bowled him! Starc rattles the stumps with a searing 148 kph yorker! Rohit departs.' },
      { inningsId: inn1.id, overNumber: 1, ballInOver: 2, legalBallNumber: 8, bowlerId: createdPlayersMap['Mitchell Starc'].id, strikerId: createdPlayersMap['Hardik Pandya'].id, nonStrikerId: createdPlayersMap['Suryakumar Yadav'].id, runs: 4, commentary: 'FOUR! Hardik gets off the mark with an emphatic punch through extra cover!' },
    ],
  });

  // Upcoming Cricket Matches
  await prisma.match.create({
    data: {
      tournamentId: crkTourney.id,
      venueId: venues[3].id,
      round: 1,
      matchNumber: 2,
      scheduledAt: new Date('2026-11-14T09:30:00Z'),
      status: 'SCHEDULED',
      matchTeams: {
        create: [
          { teamId: crkTeams[2].id, side: 'HOME' },
          { teamId: crkTeams[3].id, side: 'AWAY' },
        ],
      },
    },
  });

  await prisma.standing.createMany({
    data: [
      {
        tournamentId: crkTourney.id,
        teamId: crkTeams[0].id,
        played: 1,
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 188,
        goalsAgainst: 182,
        scoreDifference: 6,
        points: 2,
        rank: 1,
      },
      {
        tournamentId: crkTourney.id,
        teamId: crkTeams[1].id,
        played: 1,
        wins: 0,
        draws: 0,
        losses: 1,
        goalsFor: 182,
        goalsAgainst: 188,
        scoreDifference: -6,
        points: 0,
        rank: 2,
      },
      {
        tournamentId: crkTourney.id,
        teamId: crkTeams[2].id,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        scoreDifference: 0,
        points: 0,
        rank: 3,
      },
      {
        tournamentId: crkTourney.id,
        teamId: crkTeams[3].id,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        scoreDifference: 0,
        points: 0,
        rank: 4,
      },
    ],
  });

  // 12. Seed Basketball Knockout Matches
  await prisma.match.create({
    data: {
      tournamentId: bskTourney.id,
      venueId: venues[4].id,
      round: 1,
      matchNumber: 1,
      scheduledAt: new Date('2026-11-10T19:30:00Z'),
      status: 'SCHEDULED',
      matchTeams: {
        create: [
          { teamId: bskTeams[0].id, side: 'HOME' },
          { teamId: bskTeams[1].id, side: 'AWAY' },
        ],
      },
    },
  });

  await prisma.match.create({
    data: {
      tournamentId: bskTourney.id,
      venueId: venues[5].id,
      round: 1,
      matchNumber: 2,
      scheduledAt: new Date('2026-11-11T20:00:00Z'),
      status: 'SCHEDULED',
      matchTeams: {
        create: [
          { teamId: bskTeams[2].id, side: 'HOME' },
          { teamId: bskTeams[3].id, side: 'AWAY' },
        ],
      },
    },
  });

  console.log('--- ✅ COMPREHENSIVE SEEDING COMPLETED SUCCESSFULLY! ---');
  console.log('Ready with 6 sports, 10 venues, 16 teams, 56 players, 3 tournaments, matches, live scores, standings & stats.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
