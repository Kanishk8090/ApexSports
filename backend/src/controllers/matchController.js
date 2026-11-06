const matchService = require('../services/matchService');
const fixtureGeneratorService = require('../services/fixtureGeneratorService');
const standingsService = require('../services/standingsService');
const tournamentService = require('../services/tournamentService');

const getAllMatches = async (req, res, next) => {
  try {
    const { tournamentId, venueId, status, sportId } = req.query;
    const matches = await matchService.getAllMatches({ tournamentId, venueId, status, sportId });
    res.json({ success: true, count: matches.length, data: matches });
  } catch (error) {
    next(error);
  }
};

const getMatchById = async (req, res, next) => {
  try {
    const match = await matchService.getMatchById(req.params.id);
    res.json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

const createMatch = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    if (userRole !== 'ADMIN' && req.body.tournamentId) {
      const tournament = await tournamentService.getTournamentById(req.body.tournamentId);
      if (tournament.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to schedule matches for this tournament',
        });
      }
    }
    const match = await matchService.createMatch(req.body);
    res.status(201).json({
      success: true,
      message: 'Match scheduled successfully',
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

const updateMatch = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    if (userRole !== 'ADMIN') {
      const existingMatch = await matchService.getMatchById(req.params.id);
      if (existingMatch.tournament?.createdBy && existingMatch.tournament.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to modify matches for this tournament',
        });
      }
    }
    const match = await matchService.updateMatch(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Match updated successfully',
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMatch = async (req, res, next) => {
  try {
    await matchService.deleteMatch(req.params.id);
    res.json({
      success: true,
      message: 'Match deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const generateTournamentFixtures = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    if (userRole !== 'ADMIN') {
      const tournament = await tournamentService.getTournamentById(req.params.id);
      if (tournament.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to generate fixtures for this tournament',
        });
      }
    }
    const fixtures = await fixtureGeneratorService.generateTournamentFixtures(req.params.id);
    res.status(201).json({
      success: true,
      message: `Generated ${fixtures.length} fixtures for tournament`,
      count: fixtures.length,
      data: fixtures,
    });
  } catch (error) {
    next(error);
  }
};

const completeMatchWithScore = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    if (userRole !== 'ADMIN') {
      const existingMatch = await matchService.getMatchById(req.params.id);
      if (existingMatch.tournament?.createdBy && existingMatch.tournament.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to enter scores for this tournament match',
        });
      }
    }
    const match = await matchService.completeMatchWithScore(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Match score saved and standings updated successfully',
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

const getTournamentStandings = async (req, res, next) => {
  try {
    const standings = await standingsService.getTournamentStandings(req.params.id);
    res.json({
      success: true,
      count: standings.length,
      data: standings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  generateTournamentFixtures,
  completeMatchWithScore,
  getTournamentStandings,
};
