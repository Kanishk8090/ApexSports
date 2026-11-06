const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generates Round Robin fixtures for a league
 * @param {Array} teamIds - Array of registered team IDs
 * @returns {Array} List of rounds with match pairs
 */
function generateRoundRobinPairs(teamIds) {
  const teams = [...teamIds];
  // If odd number of teams, add a dummy team for bye
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) {
    teams.push(null);
  }

  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;
  const rounds = [];

  for (let r = 0; r < numRounds; r++) {
    const roundMatches = [];
    for (let i = 0; i < half; i++) {
      const home = teams[i];
      const away = teams[numTeams - 1 - i];

      if (home !== null && away !== null) {
        // Alternate home/away based on round for fairness
        if (r % 2 === 1) {
          roundMatches.push({ homeTeamId: away, awayTeamId: home });
        } else {
          roundMatches.push({ homeTeamId: home, awayTeamId: away });
        }
      }
    }
    rounds.push(roundMatches);

    // Rotate teams (keep index 0 fixed, rotate others)
    const fixed = teams[0];
    const rest = teams.slice(1);
    rest.unshift(rest.pop());
    teams.splice(0, teams.length, fixed, ...rest);
  }

  return rounds;
}

/**
 * Generates Knockout bracket pairs
 * @param {Array} teamIds - Array of registered team IDs
 * @returns {Array} First round matches
 */
function generateKnockoutFirstRound(teamIds) {
  const pairs = [];
  // Pair 1 vs 8, 2 vs 7, etc. or sequentially
  for (let i = 0; i < teamIds.length; i += 2) {
    if (i + 1 < teamIds.length) {
      pairs.push({
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[i + 1],
      });
    }
  }
  return pairs;
}

/**
 * Main service to generate fixtures and persist in database
 */
const generateTournamentFixtures = async (tournamentId) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      tournamentTeams: {
        include: { team: true },
        orderBy: [{ seed: 'asc' }, { registeredAt: 'asc' }],
      },
      matches: true,
    },
  });

  if (!tournament) {
    const error = new Error('Tournament not found');
    error.statusCode = 404;
    throw error;
  }

  const teamList = tournament.tournamentTeams.map((tt) => tt.teamId);
  if (teamList.length < 2) {
    const error = new Error('At least 2 teams must be registered to generate fixtures');
    error.statusCode = 400;
    throw error;
  }

  // Remove existing matches in DRAFT or SCHEDULED status if regenerating
  const existingMatches = await prisma.match.findMany({
    where: { tournamentId },
    include: { result: true },
  });

  const hasCompletedMatches = existingMatches.some((m) => m.status === 'COMPLETED');
  if (hasCompletedMatches) {
    const error = new Error('Cannot regenerate fixtures for a tournament that already has completed matches');
    error.statusCode = 400;
    throw error;
  }

  // Clean previous scheduled matches
  if (existingMatches.length > 0) {
    await prisma.match.deleteMany({
      where: { tournamentId },
    });
  }

  // Fetch available venues
  const venues = await prisma.venue.findMany();
  let venueIndex = 0;

  const startDate = new Date(tournament.startDate);
  let matchNumberCounter = 1;
  const createdMatches = [];

  if (tournament.format === 'LEAGUE' || tournament.format === 'GROUP_KNOCKOUT') {
    const rounds = generateRoundRobinPairs(teamList);

    for (let roundIdx = 0; roundIdx < rounds.length; roundIdx++) {
      const roundMatches = rounds[roundIdx];
      // Schedule matches for this round (spread over days/hours)
      const roundDate = new Date(startDate.getTime() + roundIdx * 24 * 60 * 60 * 1000 * 3); // 3 days per round

      for (let mIdx = 0; mIdx < roundMatches.length; mIdx++) {
        const pair = roundMatches[mIdx];
        const matchTime = new Date(roundDate.getTime() + mIdx * 3 * 60 * 60 * 1000); // 3-hour staggered
        const venue = venues.length > 0 ? venues[venueIndex % venues.length] : null;
        venueIndex++;

        const newMatch = await prisma.match.create({
          data: {
            tournamentId,
            round: roundIdx + 1,
            matchNumber: matchNumberCounter++,
            scheduledAt: matchTime,
            status: 'SCHEDULED',
            venueId: venue ? venue.id : null,
            matchTeams: {
              create: [
                { teamId: pair.homeTeamId, side: 'HOME' },
                { teamId: pair.awayTeamId, side: 'AWAY' },
              ],
            },
          },
          include: {
            venue: true,
            matchTeams: { include: { team: true } },
          },
        });
        createdMatches.push(newMatch);
      }
    }
  } else if (tournament.format === 'KNOCKOUT') {
    const firstRoundPairs = generateKnockoutFirstRound(teamList);

    for (let mIdx = 0; mIdx < firstRoundPairs.length; mIdx++) {
      const pair = firstRoundPairs[mIdx];
      const matchTime = new Date(startDate.getTime() + mIdx * 4 * 60 * 60 * 1000);
      const venue = venues.length > 0 ? venues[venueIndex % venues.length] : null;
      venueIndex++;

      const newMatch = await prisma.match.create({
        data: {
          tournamentId,
          round: 1,
          matchNumber: matchNumberCounter++,
          scheduledAt: matchTime,
          status: 'SCHEDULED',
          venueId: venue ? venue.id : null,
          matchTeams: {
            create: [
              { teamId: pair.homeTeamId, side: 'HOME' },
              { teamId: pair.awayTeamId, side: 'AWAY' },
            ],
          },
        },
        include: {
          venue: true,
          matchTeams: { include: { team: true } },
        },
      });
      createdMatches.push(newMatch);
    }
  }

  // Update tournament status to UPCOMING if it was DRAFT
  if (tournament.status === 'DRAFT') {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'UPCOMING' },
    });
  }

  return createdMatches;
};

module.exports = {
  generateTournamentFixtures,
};
