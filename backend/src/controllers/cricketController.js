const cricketService = require('../services/cricketScoringService');
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

const getCricketDetails = async (req, res, next) => {
  try {
    const data = await cricketService.getCricketMatchDetails(req.params.matchId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const startInnings = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await cricketService.startCricketInnings(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.status(201).json({ success: true, message: 'Innings commenced', data });
  } catch (error) {
    next(error);
  }
};

const recordDelivery = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await cricketService.recordCricketDelivery(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Delivery recorded', data });
  } catch (error) {
    next(error);
  }
};

const undoDelivery = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await cricketService.undoLastCricketDelivery(
      req.params.matchId,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Last delivery undone successfully', data });
  } catch (error) {
    next(error);
  }
};

const updateActivePlayers = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await cricketService.updateCricketActivePlayers(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Active players updated', data });
  } catch (error) {
    next(error);
  }
};

const endInnings = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await cricketService.endCricketInnings(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Innings closed', data });
  } catch (error) {
    next(error);
  }
};

const finalizeMatch = async (req, res, next) => {
  try {
    await checkMatchOrganizerAccess(req.params.matchId, req.user);
    const data = await cricketService.finalizeCricketMatch(
      req.params.matchId,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Cricket match finalized and standings updated', data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCricketDetails,
  startInnings,
  recordDelivery,
  undoDelivery,
  updateActivePlayers,
  endInnings,
  finalizeMatch,
};

