const { prisma } = require('../config/prisma');

class PlayerService {
  static async getAllPlayers(query = {}) {
    const { sportId, teamId, search } = query;

    const where = {};

    if (sportId) {
      where.sportId = sportId;
    }

    if (teamId) {
      where.teamPlayers = {
        some: { teamId },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nationality: { contains: search } },
      ];
    }

    return prisma.player.findMany({
      where,
      include: {
        sport: true,
        teamPlayers: {
          include: {
            team: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getPlayerById(id) {
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        sport: true,
        teamPlayers: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!player) {
      throw { statusCode: 404, message: 'Player not found' };
    }

    return player;
  }

  static async createPlayer(data) {
    // Check sport exists
    const sport = await prisma.sport.findUnique({ where: { id: data.sportId } });
    if (!sport) {
      throw { statusCode: 400, message: 'Invalid sportId. Sport does not exist.' };
    }

    return prisma.player.create({
      data: {
        name: data.name,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        nationality: data.nationality || null,
        sportId: data.sportId,
      },
      include: {
        sport: true,
      },
    });
  }

  static async updatePlayer(id, data) {
    await this.getPlayerById(id);

    if (data.sportId) {
      const sport = await prisma.sport.findUnique({ where: { id: data.sportId } });
      if (!sport) {
        throw { statusCode: 400, message: 'Invalid sportId. Sport does not exist.' };
      }
    }

    const updateData = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    return prisma.player.update({
      where: { id },
      data: updateData,
      include: {
        sport: true,
        teamPlayers: { include: { team: true } },
      },
    });
  }

  static async deletePlayer(id) {
    await this.getPlayerById(id);
    return prisma.player.delete({ where: { id } });
  }
}

module.exports = { PlayerService };
