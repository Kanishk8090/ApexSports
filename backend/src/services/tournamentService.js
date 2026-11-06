const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllTournaments = async (filters = {}) => {
  const where = {};

  if (filters.sportId) {
    where.sportId = filters.sportId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.format) {
    where.format = filters.format;
  }
  if (filters.search) {
    where.name = { contains: filters.search };
  }

  return await prisma.tournament.findMany({
    where,
    include: {
      sport: true,
      creator: {
        select: { id: true, name: true, email: true },
      },
      tournamentTeams: {
        include: {
          team: true,
        },
      },
      matches: {
        include: {
          matchTeams: { include: { team: true } },
          scores: true,
          result: true,
        },
      },
      standings: {
        include: { team: true },
        orderBy: [{ points: 'desc' }, { scoreDifference: 'desc' }, { goalsFor: 'desc' }],
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getTournamentById = async (id) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      sport: true,
      creator: {
        select: { id: true, name: true, email: true },
      },
      tournamentTeams: {
        include: {
          team: {
            include: {
              teamPlayers: {
                include: { player: true },
              },
            },
          },
        },
        orderBy: [{ seed: 'asc' }, { registeredAt: 'asc' }],
      },
      matches: {
        include: {
          venue: true,
          matchTeams: {
            include: { team: true },
          },
          scores: true,
          result: {
            include: { winnerTeam: true },
          },
        },
        orderBy: [{ round: 'asc' }, { scheduledAt: 'asc' }],
      },
      standings: {
        include: { team: true },
        orderBy: [{ points: 'desc' }, { scoreDifference: 'desc' }, { goalsFor: 'desc' }],
      },
    },
  });

  if (!tournament) {
    const error = new Error('Tournament not found');
    error.statusCode = 404;
    throw error;
  }

  return tournament;
};

const createTournament = async (data, userId) => {
  const { name, sportId, description, startDate, endDate, format, status } = data;

  if (!name || !sportId || !startDate || !endDate) {
    const error = new Error('Tournament name, sportId, startDate, and endDate are required');
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    const error = new Error('Tournament end date cannot be earlier than start date');
    error.statusCode = 400;
    throw error;
  }

  // Validate sport exists
  const sport = await prisma.sport.findUnique({ where: { id: sportId } });
  if (!sport) {
    const error = new Error('Selected sport does not exist');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.tournament.create({
    data: {
      name,
      description: description || null,
      startDate: start,
      endDate: end,
      format: format || 'LEAGUE',
      status: status || 'UPCOMING',
      sport: { connect: { id: sportId } },
      creator: { connect: { id: userId } },
    },
    include: {
      sport: true,
      creator: { select: { id: true, name: true, email: true } },
    },
  });
};

const updateTournament = async (id, data, userId, userRole) => {
  const existing = await getTournamentById(id);

  if (userRole && userRole !== 'ADMIN' && existing.createdBy !== userId) {
    const error = new Error('Forbidden: You do not have permission to manage this tournament');
    error.statusCode = 403;
    throw error;
  }

  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      const error = new Error('Tournament end date cannot be earlier than start date');
      error.statusCode = 400;
      throw error;
    }
  }

  return await prisma.tournament.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
    include: {
      sport: true,
      creator: { select: { id: true, name: true, email: true } },
    },
  });
};

const deleteTournament = async (id) => {
  await getTournamentById(id);
  return await prisma.tournament.delete({ where: { id } });
};

// Tournament Team Registration
const registerTeam = async (tournamentId, { teamId, seed, group }, userId, userRole) => {
  const tournament = await getTournamentById(tournamentId);

  if (userRole && userRole !== 'ADMIN' && tournament.createdBy !== userId) {
    const error = new Error('Forbidden: You do not have permission to register teams for this tournament');
    error.statusCode = 403;
    throw error;
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    const error = new Error('Team not found');
    error.statusCode = 404;
    throw error;
  }

  // Validation: Team sport must match tournament sport
  if (team.sportId !== tournament.sportId) {
    const error = new Error(`Cannot register a team from a different sport. Tournament is for ${tournament.sport.name}.`);
    error.statusCode = 400;
    throw error;
  }

  // Check if team is already registered
  const existing = await prisma.tournamentTeam.findUnique({
    where: {
      tournamentId_teamId: { tournamentId, teamId },
    },
  });

  if (existing) {
    const error = new Error('This team is already registered in this tournament');
    error.statusCode = 400;
    throw error;
  }

  const registered = await prisma.tournamentTeam.create({
    data: {
      tournamentId,
      teamId,
      seed: seed ? parseInt(seed, 10) : null,
      group: group || null,
    },
    include: {
      team: true,
    },
  });

  // Ensure initial standing record exists for this team in tournament
  await prisma.standing.upsert({
    where: {
      tournamentId_teamId: { tournamentId, teamId },
    },
    update: {},
    create: {
      tournamentId,
      teamId,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      scoreDifference: 0,
      rank: 0,
    },
  });

  return registered;
};

const removeTeam = async (tournamentId, teamId, userId, userRole) => {
  const tournament = await getTournamentById(tournamentId);

  if (userRole && userRole !== 'ADMIN' && tournament.createdBy !== userId) {
    const error = new Error('Forbidden: You do not have permission to remove teams from this tournament');
    error.statusCode = 403;
    throw error;
  }

  const existing = await prisma.tournamentTeam.findUnique({
    where: {
      tournamentId_teamId: { tournamentId, teamId },
    },
  });

  if (!existing) {
    const error = new Error('Team is not registered in this tournament');
    error.statusCode = 404;
    throw error;
  }

  // Check if team has matches in this tournament
  const matchCount = await prisma.matchTeam.count({
    where: {
      teamId,
      match: { tournamentId },
    },
  });

  if (matchCount > 0) {
    const error = new Error('Cannot remove team because it is already scheduled in tournament matches.');
    error.statusCode = 400;
    throw error;
  }

  await prisma.standing.deleteMany({
    where: { tournamentId, teamId },
  });

  return await prisma.tournamentTeam.delete({
    where: {
      tournamentId_teamId: { tournamentId, teamId },
    },
  });
};

const getTournamentTeams = async (tournamentId) => {
  await getTournamentById(tournamentId);

  return await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    include: {
      team: {
        include: {
          teamPlayers: {
            include: { player: true },
          },
        },
      },
    },
    orderBy: [{ seed: 'asc' }, { registeredAt: 'asc' }],
  });
};

module.exports = {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  registerTeam,
  removeTeam,
  getTournamentTeams,
};
