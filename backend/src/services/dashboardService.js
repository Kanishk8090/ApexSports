const { prisma } = require('../config/prisma');

class DashboardService {
  static async getSummary() {
    const [liveMatchesList, upcomingMatchesList, recentResultsList] = await Promise.all([
      // Live Matches
      prisma.match.findMany({
        where: { status: 'LIVE' },
        orderBy: { scheduledAt: 'asc' },
        include: {
          tournament: { select: { name: true, sport: { select: { name: true } } } },
          venue: { select: { name: true, location: true } },
          matchTeams: { include: { team: true } },
          scores: true,
        },
      }),
      // Upcoming Fixtures
      prisma.match.findMany({
        where: { status: 'SCHEDULED' },
        take: 10,
        orderBy: { scheduledAt: 'asc' },
        include: {
          tournament: { select: { name: true, sport: { select: { name: true } } } },
          venue: { select: { name: true, location: true } },
          matchTeams: { include: { team: true } },
        },
      }),
      // Recent Completed Results
      prisma.match.findMany({
        where: { status: 'COMPLETED' },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: {
          tournament: { select: { name: true, sport: { select: { name: true } } } },
          venue: { select: { name: true, location: true } },
          matchTeams: { include: { team: true } },
          scores: true,
          result: { include: { winnerTeam: true } },
        },
      }),
    ]);

    return {
      liveMatches: liveMatchesList,
      upcomingMatches: upcomingMatchesList,
      recentResults: recentResultsList,
    };
  }
}

module.exports = { DashboardService };
