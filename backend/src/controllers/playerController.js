const { PlayerService } = require('../services/playerService');
const { validatePlayer } = require('../validators');

const getAllPlayers = async (req, res, next) => {
  try {
    const players = await PlayerService.getAllPlayers(req.query);
    return res.status(200).json({ success: true, data: players });
  } catch (error) {
    next(error);
  }
};

const getPlayerById = async (req, res, next) => {
  try {
    const player = await PlayerService.getPlayerById(req.params.id);
    return res.status(200).json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
};

const createPlayer = async (req, res, next) => {
  try {
    const errors = validatePlayer(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    const player = await PlayerService.createPlayer(req.body);
    return res.status(201).json({ success: true, message: 'Player created', data: player });
  } catch (error) {
    next(error);
  }
};

const updatePlayer = async (req, res, next) => {
  try {
    const player = await PlayerService.updatePlayer(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Player updated', data: player });
  } catch (error) {
    next(error);
  }
};

const deletePlayer = async (req, res, next) => {
  try {
    await PlayerService.deletePlayer(req.params.id);
    return res.status(200).json({ success: true, message: 'Player deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
};
