const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculates points based on sport code and result
 */
function getSportPoints(sportCode, resultType) {
  const code = (sportCode || '').toUpperCase();

  if (resultType === 'WIN') {
    if (code === 'FTB') return 3; // Football: 3 points for win
    return 2; // Cricket, Basketball, Tennis, etc: 2 points for win
  }

  if (resultType === 'DRAW' || resultType === 'TIE') {
    if (code === 'FTB') return 1; // Football: 1 point for draw
    if (code === 'CRK') return 1; // Cricket: 1 point for tie/no result
    return 1;
  }

  return 0; // LOSS, etc.
}

/**
 * Recalculates all standing rows for a tournament within a transaction
 */
const recalculateTournamentStandings = async (tournamentId, tx = prisma) => {
  const tournament = await tx.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      sport: true,
      tournamentTeams: { include: { team: true } },
      matches: {
        where: { status: 'COMPLETED' },
        include: {
          scores: true,
          result: true,
          matchTeams: true,
        },
      },
    },
  });

  if (!tournament) return;

  const sportCode = tournament.sport.code;
  const registeredTeamIds = tournament.tournamentTeams.map((tt) => tt.teamId);

  // Initialize stats map for each registered team
  const statsMap = {};
  for (const teamId of registeredTeamIds) {
    statsMap[teamId] = {
      teamId,
      tournamentId,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      scoreDifference: 0,
    };
  }

  // Iterate over completed matches
  for (const match of tournament.matches) {
    if (!match.result || match.scores.length < 2) continue;

    const homeTeamRel = match.matchTeams.find((mt) => mt.side === 'HOME');
    const awayTeamRel = match.matchTeams.find((mt) => mt.side === 'AWAY');

    if (!homeTeamRel || !awayTeamRel) continue;

    const homeTeamId = homeTeamRel.teamId;
    const awayTeamId = awayTeamRel.teamId;

    const homeScoreObj = match.scores.find((s) => s.teamId === homeTeamId);
    const awayScoreObj = match.scores.find((s) => s.teamId === awayTeamId);

    const homeScore = homeScoreObj ? homeScoreObj.scoreValue : 0;
    const awayScore = awayScoreObj ? awayScoreObj.scoreValue : 0;

    // Ensure teams exist in statsMap
    if (!statsMap[homeTeamId]) {
      statsMap[homeTeamId] = {
        teamId: homeTeamId,
        tournamentId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        scoreDifference: 0,
      };
    }
    if (!statsMap[awayTeamId]) {
      statsMap[awayTeamId] = {
        teamId: awayTeamId,
        tournamentId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        scoreDifference: 0,
      };
    }

    const homeStats = statsMap[homeTeamId];
    const awayStats = statsMap[awayTeamId];

    homeStats.played += 1;
    awayStats.played += 1;

    homeStats.goalsFor += homeScore;
    homeStats.goalsAgainst += awayScore;
    awayStats.goalsFor += awayScore;
    awayStats.goalsAgainst += homeScore;

    if (match.result.resultType === 'DRAW' || match.result.resultType === 'TIE') {
      homeStats.draws += 1;
      awayStats.draws += 1;
      homeStats.points += getSportPoints(sportCode, 'DRAW');
      awayStats.points += getSportPoints(sportCode, 'DRAW');
    } else if (match.result.winnerTeamId === homeTeamId) {
      homeStats.wins += 1;
      awayStats.losses += 1;
      homeStats.points += getSportPoints(sportCode, 'WIN');
    } else if (match.result.winnerTeamId === awayTeamId) {
      awayStats.wins += 1;
      homeStats.losses += 1;
      awayStats.points += getSportPoints(sportCode, 'WIN');
    }
  }

  // Calculate score difference and rank
  const statsList = Object.values(statsMap);
  for (const s of statsList) {
    s.scoreDifference = s.goalsFor - s.goalsAgainst;
  }

  // Sort: points desc, then scoreDifference desc, then goalsFor desc
  statsList.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.scoreDifference !== a.scoreDifference) return b.scoreDifference - a.scoreDifference;
    return b.goalsFor - a.goalsFor;
  });

  // Assign ranks
  statsList.forEach((stat, idx) => {
    stat.rank = idx + 1;
  });

  // Update or insert into Standings table
  for (const stat of statsList) {
    await tx.standing.upsert({
      where: {
        tournamentId_teamId: {
          tournamentId: stat.tournamentId,
          teamId: stat.teamId,
        },
      },
      update: {
        played: stat.played,
        wins: stat.wins,
        draws: stat.draws,
        losses: stat.losses,
        points: stat.points,
        goalsFor: stat.goalsFor,
        goalsAgainst: stat.goalsAgainst,
        scoreDifference: stat.scoreDifference,
        rank: stat.rank,
      },
      create: stat,
    });
  }

  return statsList;
};

const getTournamentStandings = async (tournamentId) => {
  return await prisma.standing.findMany({
    where: { tournamentId },
    include: {
      team: {
        include: { sport: true },
      },
      tournament: {
        include: { sport: true },
      },
    },
    orderBy: [{ rank: 'asc' }, { points: 'desc' }, { scoreDifference: 'desc' }],
  });
};

module.exports = {
  recalculateTournamentStandings,
  getTournamentStandings,
  getSportPoints,
};
