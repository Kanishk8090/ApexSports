const { PrismaClient } = require('@prisma/client');
const { recalculateTournamentStandings } = require('./standingsService');

const prisma = new PrismaClient();

const getAllMatches = async (filters = {}) => {
  const where = {};

  if (filters.tournamentId) {
    where.tournamentId = filters.tournamentId;
  }
  if (filters.venueId) {
    where.venueId = filters.venueId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.sportId) {
    where.tournament = { sportId: filters.sportId };
  }

  return await prisma.match.findMany({
    where,
    include: {
      tournament: {
        include: { sport: true },
      },
      venue: true,
      matchTeams: {
        include: { team: true },
      },
      scores: {
        include: { team: true },
      },
      result: {
        include: { winnerTeam: true },
      },
    },
    orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }],
  });
};

const getMatchById = async (id) => {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: {
        include: {
          sport: true,
          tournamentTeams: { include: { team: true } },
        },
      },
      venue: true,
      matchTeams: {
        include: {
          team: {
            include: {
              teamPlayers: {
                include: { player: true },
              },
            },
          },
        },
      },
      scores: {
        include: { team: true },
      },
      result: {
        include: { winnerTeam: true },
      },
    },
  });

  if (!match) {
    const error = new Error('Match not found');
    error.statusCode = 404;
    throw error;
  }

  return match;
};

// Check for venue conflict: match scheduled at the same venue within a 2-hour window
const checkVenueConflict = async (venueId, scheduledAt, excludeMatchId = null) => {
  if (!venueId || !scheduledAt) return;

  const matchTime = new Date(scheduledAt);
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const windowStart = new Date(matchTime.getTime() - twoHoursMs);
  const windowEnd = new Date(matchTime.getTime() + twoHoursMs);

  const conflictingMatch = await prisma.match.findFirst({
    where: {
      venueId,
      id: excludeMatchId ? { not: excludeMatchId } : undefined,
      status: { in: ['SCHEDULED', 'LIVE'] },
      scheduledAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    include: { venue: true, tournament: true },
  });

  if (conflictingMatch) {
    const error = new Error(
      `Venue conflict: ${conflictingMatch.venue?.name} already has a match scheduled around ${conflictingMatch.scheduledAt.toISOString()}`
    );
    error.statusCode = 409;
    throw error;
  }
};

const createMatch = async (data) => {
  const { tournamentId, homeTeamId, awayTeamId, venueId, scheduledAt, round, matchNumber } = data;

  if (!tournamentId || !homeTeamId || !awayTeamId || !scheduledAt) {
    const error = new Error('tournamentId, homeTeamId, awayTeamId, and scheduledAt are required');
    error.statusCode = 400;
    throw error;
  }

  if (homeTeamId === awayTeamId) {
    const error = new Error('A team cannot play against itself');
    error.statusCode = 400;
    throw error;
  }

  // Validate teams belong to tournament
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { tournamentTeams: true },
  });

  if (!tournament) {
    const error = new Error('Tournament not found');
    error.statusCode = 404;
    throw error;
  }

  const registeredIds = tournament.tournamentTeams.map((tt) => tt.teamId);
  if (!registeredIds.includes(homeTeamId) || !registeredIds.includes(awayTeamId)) {
    const error = new Error('Both teams must be registered in the tournament');
    error.statusCode = 400;
    throw error;
  }

  // Check venue availability
  if (venueId) {
    await checkVenueConflict(venueId, scheduledAt);
  }

  return await prisma.match.create({
    data: {
      tournamentId,
      venueId: venueId || null,
      round: round ? parseInt(round, 10) : 1,
      matchNumber: matchNumber ? parseInt(matchNumber, 10) : 1,
      scheduledAt: new Date(scheduledAt),
      status: 'SCHEDULED',
      matchTeams: {
        create: [
          { teamId: homeTeamId, side: 'HOME' },
          { teamId: awayTeamId, side: 'AWAY' },
        ],
      },
    },
    include: {
      venue: true,
      matchTeams: { include: { team: true } },
    },
  });
};

const updateMatch = async (id, data) => {
  const match = await getMatchById(id);

  if (data.scheduledAt || data.venueId) {
    const venueToCheck = data.venueId !== undefined ? data.venueId : match.venueId;
    const timeToCheck = data.scheduledAt || match.scheduledAt;
    if (venueToCheck) {
      await checkVenueConflict(venueToCheck, timeToCheck, id);
    }
  }

  return await prisma.match.update({
    where: { id },
    data: {
      venueId: data.venueId !== undefined ? data.venueId : undefined,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      round: data.round !== undefined ? parseInt(data.round, 10) : undefined,
      matchNumber: data.matchNumber !== undefined ? parseInt(data.matchNumber, 10) : undefined,
      status: data.status || undefined,
    },
    include: {
      venue: true,
      matchTeams: { include: { team: true } },
      scores: true,
      result: true,
    },
  });
};

const deleteMatch = async (id) => {
  await getMatchById(id);
  return await prisma.match.delete({ where: { id } });
};

/**
 * Score entry and Match Completion Transaction (Week 4 Core Requirement)
 * Records score for both teams, determines winner, saves Result, marks match COMPLETED,
 * and recalculates Tournament standings in a clean DB transaction.
 */
const completeMatchWithScore = async (matchId, payload) => {
  const { homeScore, awayScore, period, details } = payload;

  const match = await getMatchById(matchId);

  if (match.status === 'CANCELLED') {
    const error = new Error('Cannot submit scores for a cancelled match');
    error.statusCode = 400;
    throw error;
  }

  const homeTeamRel = match.matchTeams.find((mt) => mt.side === 'HOME');
  const awayTeamRel = match.matchTeams.find((mt) => mt.side === 'AWAY');

  if (!homeTeamRel || !awayTeamRel) {
    const error = new Error('Match must have both HOME and AWAY teams assigned');
    error.statusCode = 400;
    throw error;
  }

  const hScore = parseInt(homeScore, 10);
  const aScore = parseInt(awayScore, 10);

  if (isNaN(hScore) || isNaN(aScore) || hScore < 0 || aScore < 0) {
    const error = new Error('Scores must be non-negative integers');
    error.statusCode = 400;
    throw error;
  }

  // Determine result
  let winnerTeamId = null;
  let resultType = 'DRAW';

  if (hScore > aScore) {
    winnerTeamId = homeTeamRel.teamId;
    resultType = 'WIN';
  } else if (aScore > hScore) {
    winnerTeamId = awayTeamRel.teamId;
    resultType = 'WIN';
  } else {
    // Equal score
    const sportCode = match.tournament.sport.code;
    resultType = sportCode === 'CRK' ? 'TIE' : 'DRAW';
  }

  // Execute in Prisma transaction
  const transactionResult = await prisma.$transaction(async (tx) => {
    // 1. Update/Upsert Home Score
    await tx.score.upsert({
      where: {
        matchId_teamId: { matchId, teamId: homeTeamRel.teamId },
      },
      update: {
        scoreValue: hScore,
        period: period || 'Full Time',
        details: details || null,
      },
      create: {
        matchId,
        teamId: homeTeamRel.teamId,
        scoreValue: hScore,
        period: period || 'Full Time',
        details: details || null,
      },
    });

    // 2. Update/Upsert Away Score
    await tx.score.upsert({
      where: {
        matchId_teamId: { matchId, teamId: awayTeamRel.teamId },
      },
      update: {
        scoreValue: aScore,
        period: period || 'Full Time',
        details: details || null,
      },
      create: {
        matchId,
        teamId: awayTeamRel.teamId,
        scoreValue: aScore,
        period: period || 'Full Time',
        details: details || null,
      },
    });

    // 3. Upsert Result
    const savedResult = await tx.result.upsert({
      where: { matchId },
      update: {
        winnerTeamId,
        resultType,
        completedAt: new Date(),
      },
      create: {
        matchId,
        winnerTeamId,
        resultType,
        completedAt: new Date(),
      },
    });

    // 4. Update match status to COMPLETED
    const updatedMatch = await tx.match.update({
      where: { id: matchId },
      data: { status: 'COMPLETED' },
    });

    // 5. Recalculate Standings automatically
    await recalculateTournamentStandings(match.tournamentId, tx);

    return { updatedMatch, savedResult };
  });

  // Check if tournament should be marked ONGOING or COMPLETED
  const allTournamentMatches = await prisma.match.findMany({
    where: { tournamentId: match.tournamentId },
  });
  const allCompleted = allTournamentMatches.every((m) => m.status === 'COMPLETED');
  await prisma.tournament.update({
    where: { id: match.tournamentId },
    data: { status: allCompleted ? 'COMPLETED' : 'ONGOING' },
  });

  return await getMatchById(matchId);
};

module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  completeMatchWithScore,
};
