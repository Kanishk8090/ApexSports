const { prisma } = require('../config/prisma');

class TeamService {
  static async getAllTeams(query = {}) {
    const { sportId, search } = query;
    const where = {};

    if (sportId) {
      where.sportId = sportId;
    }

    if (search) {
      where.name = { contains: search };
    }

    return prisma.team.findMany({
      where,
      include: {
        sport: true,
        teamPlayers: {
          include: {
            player: true,
          },
        },
        _count: {
          select: {
            teamPlayers: true,
            tournamentTeams: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getTeamById(id) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        sport: true,
        teamPlayers: {
          include: {
            player: {
              include: {
                sport: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        tournamentTeams: {
          include: {
            tournament: true,
          },
        },
      },
    });

    if (!team) {
      throw { statusCode: 404, message: 'Team not found' };
    }

    return team;
  }

  static async createTeam(data) {
    const sport = await prisma.sport.findUnique({ where: { id: data.sportId } });
    if (!sport) {
      throw { statusCode: 400, message: 'Invalid sportId. Sport does not exist.' };
    }

    const existingName = await prisma.team.findFirst({
      where: {
        sportId: data.sportId,
        name: data.name,
      },
    });

    if (existingName) {
      throw { statusCode: 400, message: 'A team with this name already exists in this sport.' };
    }

    return prisma.team.create({
      data: {
        name: data.name,
        sportId: data.sportId,
        description: data.description || null,
      },
      include: {
        sport: true,
      },
    });
  }

  static async updateTeam(id, data) {
    const currentTeam = await this.getTeamById(id);

    const targetSportId = data.sportId || currentTeam.sportId;
    const targetName = data.name || currentTeam.name;

    const existingName = await prisma.team.findFirst({
      where: {
        sportId: targetSportId,
        name: targetName,
        NOT: { id },
      },
    });

    if (existingName) {
      throw { statusCode: 400, message: 'A team with this name already exists in this sport.' };
    }

    return prisma.team.update({
      where: { id },
      data,
      include: {
        sport: true,
      },
    });
  }

  static async deleteTeam(id) {
    await this.getTeamById(id);
    return prisma.team.delete({ where: { id } });
  }

  static async addPlayerToTeam(teamId, data) {
    const team = await this.getTeamById(teamId);

    const player = await prisma.player.findUnique({
      where: { id: data.playerId },
    });

    if (!player) {
      throw { statusCode: 404, message: 'Player not found' };
    }

    // SPEC RULE: A player can only join a team of the same sport!
    if (player.sportId !== team.sportId) {
      throw {
        statusCode: 400,
        message: 'Cannot add player to team of a different sport. Player and Team sports must match.',
      };
    }

    const existingMembership = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId: data.playerId,
        },
      },
    });

    if (existingMembership) {
      throw { statusCode: 400, message: 'Player is already a member of this team.' };
    }

    return prisma.teamPlayer.create({
      data: {
        teamId,
        playerId: data.playerId,
        jerseyNumber: data.jerseyNumber !== undefined ? data.jerseyNumber : null,
      },
      include: {
        player: true,
        team: true,
      },
    });
  }

  static async removePlayerFromTeam(teamId, playerId) {
    await this.getTeamById(teamId);

    const existing = await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });

    if (!existing) {
      throw { statusCode: 404, message: 'Player is not in this team roster.' };
    }

    return prisma.teamPlayer.delete({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });
  }
}

module.exports = { TeamService };
