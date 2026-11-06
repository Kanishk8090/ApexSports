const tournamentService = require('../services/tournamentService');

const getAllTournaments = async (req, res, next) => {
  try {
    const { sportId, status, format, search } = req.query;
    const tournaments = await tournamentService.getAllTournaments({ sportId, status, format, search });
    res.json({ success: true, count: tournaments.length, data: tournaments });
  } catch (error) {
    next(error);
  }
};

const getTournamentById = async (req, res, next) => {
  try {
    const tournament = await tournamentService.getTournamentById(req.params.id);
    res.json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

const createTournament = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const tournament = await tournamentService.createTournament(req.body, userId);
    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament,
    });
  } catch (error) {
    next(error);
  }
};

const updateTournament = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    const tournament = await tournamentService.updateTournament(req.params.id, req.body, userId, userRole);
    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: tournament,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTournament = async (req, res, next) => {
  try {
    await tournamentService.deleteTournament(req.params.id);
    res.json({
      success: true,
      message: 'Tournament deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const registerTeam = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    const registered = await tournamentService.registerTeam(req.params.id, req.body, userId, userRole);
    res.status(201).json({
      success: true,
      message: 'Team registered into tournament successfully',
      data: registered,
    });
  } catch (error) {
    next(error);
  }
};

const removeTeam = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;
    await tournamentService.removeTeam(req.params.id, req.params.teamId, userId, userRole);
    res.json({
      success: true,
      message: 'Team removed from tournament successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getTournamentTeams = async (req, res, next) => {
  try {
    const teams = await tournamentService.getTournamentTeams(req.params.id);
    res.json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    next(error);
  }
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
