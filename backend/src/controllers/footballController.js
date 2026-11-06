const footballService = require('../services/footballScoringService');
const { prisma } = require('../config/prisma');

const checkMatchOrganizerAccess = async (matchId, user) => {
  if (user.role === 'ADMIN') return true;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });
  if (!match) {
    const error = new Error('Match not found');
    error.statusCode = 404;
    throw error;
  }
  if (match.tournament.createdBy !== user.id) {
    const error = new Error('Forbidden: You are not authorized to score this tournament match');
    error.statusCode = 403;
    throw error;
  }
  return true;
};

const getFootballDetails = async (req, res, next) => {
  try {
    const data = await footballService.getFootballMatchDetails(req.params.matchId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const startMatch = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await footballService.startFootballMatch(
      req.params.matchId,
      req.user.id,
      req.user.role
    );
    res.status(200).json({ success: true, message: 'Match started', data });
  } catch (error) {
    next(error);
  }
};

const updateClock = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await footballService.updateFootballClock(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Clock updated', data });
  } catch (error) {
    next(error);
  }
};

const recordEvent = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await footballService.recordFootballEvent(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.status(201).json({ success: true, message: 'Event recorded', data });
  } catch (error) {
    next(error);
  }
};

const undoEvent = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await footballService.undoFootballEvent(
      req.params.matchId,
      req.params.eventId,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Event undone', data });
  } catch (error) {
    next(error);
  }
};

const saveLineups = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await footballService.saveFootballLineups(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Lineups saved', data });
  } catch (error) {
    next(error);
  }
};

const updateStats = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await footballService.updateFootballStats(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Match statistics updated', data });
  } catch (error) {
    next(error);
  }
};

const finalizeMatch = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await footballService.finalizeFootballMatch(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Football match finalized and standings updated', data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFootballDetails,
  startMatch,
  updateClock,
  recordEvent,
  undoEvent,
  saveLineups,
  updateStats,
  finalizeMatch,
};

