const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllVenues = async (filters = {}) => {
  const where = {};
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { location: { contains: filters.search } },
    ];
  }

  return await prisma.venue.findMany({
    where,
    include: {
      matches: {
        where: { status: { in: ['SCHEDULED', 'LIVE'] } },
        include: {
          tournament: { select: { name: true } },
          matchTeams: { include: { team: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

const getVenueById = async (id) => {
  const venue = await prisma.venue.findUnique({
    where: { id },
    include: {
      matches: {
        include: {
          tournament: true,
          matchTeams: { include: { team: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      },
    },
  });

  if (!venue) {
    const error = new Error('Venue not found');
    error.statusCode = 404;
    throw error;
  }

  return venue;
};

const createVenue = async (data) => {
  const { name, location, capacity, description } = data;

  if (!name || !location || capacity === undefined) {
    const error = new Error('Venue name, location, and capacity are required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.venue.findUnique({ where: { name } });
  if (existing) {
    const error = new Error('A venue with this name already exists');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.venue.create({
    data: {
      name,
      location,
      capacity: parseInt(capacity, 10),
      description: description || null,
    },
  });
};

const updateVenue = async (id, data) => {
  await getVenueById(id);

  if (data.name) {
    const existing = await prisma.venue.findFirst({
      where: { name: data.name, id: { not: id } },
    });
    if (existing) {
      const error = new Error('Another venue already exists with this name');
      error.statusCode = 400;
      throw error;
    }
  }

  return await prisma.venue.update({
    where: { id },
    data: {
      ...data,
      capacity: data.capacity !== undefined ? parseInt(data.capacity, 10) : undefined,
    },
  });
};

const deleteVenue = async (id) => {
  await getVenueById(id);

  // Check if venue has upcoming matches
  const matchCount = await prisma.match.count({
    where: { venueId: id, status: { in: ['SCHEDULED', 'LIVE'] } },
  });

  if (matchCount > 0) {
    const error = new Error('Cannot delete venue that has scheduled or live matches');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.venue.delete({ where: { id } });
};

module.exports = {
  getAllVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
};
