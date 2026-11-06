const { TeamService } = require('../services/teamService');
const { validateTeam, validateTeamPlayer } = require('../validators');

const getAllTeams = async (req, res, next) => {
  try {
    const teams = await TeamService.getAllTeams(req.query);
    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

const getTeamById = async (req, res, next) => {
  try {
    const team = await TeamService.getTeamById(req.params.id);
    return res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const errors = validateTeam(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    const team = await TeamService.createTeam(req.body);
    return res.status(201).json({ success: true, message: 'Team created', data: team });
  } catch (error) {
    next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const team = await TeamService.updateTeam(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Team updated', data: team });
  } catch (error) {
    next(error);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    await TeamService.deleteTeam(req.params.id);
    return res.status(200).json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const addPlayerToTeam = async (req, res, next) => {
  try {
    const errors = validateTeamPlayer(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    const result = await TeamService.addPlayerToTeam(req.params.id, req.body);
    return res.status(201).json({ success: true, message: 'Player added to team', data: result });
  } catch (error) {
    next(error);
  }
};

const removePlayerFromTeam = async (req, res, next) => {
  try {
    await TeamService.removePlayerFromTeam(req.params.id, req.params.playerId);
    return res.status(200).json({ success: true, message: 'Player removed from team' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
};
