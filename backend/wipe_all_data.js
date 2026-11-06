const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeDatabase() {
  console.log('--- Wiping all domain data from database ---');

  // 1. Delete child records
  await prisma.cricketDelivery.deleteMany();
  await prisma.cricketInnings.deleteMany();
  await prisma.footballMatchEvent.deleteMany();
  await prisma.footballLineup.deleteMany();
  await prisma.footballMatchStat.deleteMany();
  const delScores = await prisma.score.deleteMany();
  const delResults = await prisma.result.deleteMany();
  const delMatchTeams = await prisma.matchTeam.deleteMany();
  const delMatches = await prisma.match.deleteMany();
  const delStandings = await prisma.standing.deleteMany();
  const delTourneyTeams = await prisma.tournamentTeam.deleteMany();
  const delTournaments = await prisma.tournament.deleteMany();
  const delTeamPlayers = await prisma.teamPlayer.deleteMany();
  const delTeams = await prisma.team.deleteMany();
  const delPlayers = await prisma.player.deleteMany();
  const delVenues = await prisma.venue.deleteMany();
  const delSports = await prisma.sport.deleteMany();

  // Clean temporary test accounts, but preserve System Administrator and user account
  const delTempUsers = await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'new_organizer_',
      },
    },
  });

  console.log('Deleted records count:');
  console.log(`- Scores: ${delScores.count}`);
  console.log(`- Results: ${delResults.count}`);
  console.log(`- Match Teams: ${delMatchTeams.count}`);
  console.log(`- Matches: ${delMatches.count}`);
  console.log(`- Standings: ${delStandings.count}`);
  console.log(`- Tournament Teams: ${delTourneyTeams.count}`);
  console.log(`- Tournaments: ${delTournaments.count}`);
  console.log(`- Team Players: ${delTeamPlayers.count}`);
  console.log(`- Teams: ${delTeams.count}`);
  console.log(`- Players: ${delPlayers.count}`);
  console.log(`- Venues: ${delVenues.count}`);
  console.log(`- Sports: ${delSports.count}`);
  console.log(`- Temp test accounts: ${delTempUsers.count}`);

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  console.log('\nRemaining Users in Database:');
  console.table(remainingUsers);

  console.log('\n✅ Database is now completely clean without any sports, tournaments, teams, players, venues, or matches!');
  await prisma.$disconnect();
}

wipeDatabase().catch((err) => {
  console.error('Error wiping database:', err);
  prisma.$disconnect();
  process.exit(1);
});
