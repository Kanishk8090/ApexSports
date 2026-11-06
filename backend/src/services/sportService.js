const { prisma } = require('../config/prisma');

class SportService {
  static async getAllSports() {
    return prisma.sport.findMany({
      include: {
        _count: {
          select: {
            players: true,
            teams: true,
            tournaments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getSportById(id) {
    const sport = await prisma.sport.findUnique({
      where: { id },
      include: {
        players: true,
        teams: true,
        tournaments: true,
        _count: {
          select: { players: true, teams: true, tournaments: true },
        },
      },
    });

    if (!sport) {
      throw { statusCode: 404, message: 'Sport not found' };
    }

    return sport;
  }

  static async createSport(data) {
    const existingName = await prisma.sport.findUnique({ where: { name: data.name } });
    if (existingName) {
      throw { statusCode: 400, message: 'Sport with this name already exists' };
    }

    const codeUpper = data.code.toUpperCase();
    const existingCode = await prisma.sport.findUnique({ where: { code: codeUpper } });
    if (existingCode) {
      throw { statusCode: 400, message: 'Sport with this code already exists' };
    }

    return prisma.sport.create({
      data: {
        name: data.name,
        code: codeUpper,
        description: data.description || null,
      },
    });
  }

  static async updateSport(id, data) {
    await this.getSportById(id);

    if (data.name) {
      const existing = await prisma.sport.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (existing) {
        throw { statusCode: 400, message: 'Another sport has this name' };
      }
    }

    if (data.code) {
      const codeUpper = data.code.toUpperCase();
      const existing = await prisma.sport.findFirst({
        where: { code: codeUpper, NOT: { id } },
      });
      if (existing) {
        throw { statusCode: 400, message: 'Another sport has this code' };
      }
      data.code = codeUpper;
    }

    return prisma.sport.update({
      where: { id },
      data,
    });
  }

  static async deleteSport(id) {
    await this.getSportById(id);
    return prisma.sport.delete({ where: { id } });
  }
}

module.exports = { SportService };
