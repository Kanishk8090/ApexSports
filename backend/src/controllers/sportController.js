const { SportService } = require('../services/sportService');
const { validateSport } = require('../validators');

const getAllSports = async (req, res, next) => {
  try {
    const sports = await SportService.getAllSports();
    return res.status(200).json({ success: true, data: sports });
  } catch (error) {
    next(error);
  }
};

const getSportById = async (req, res, next) => {
  try {
    const sport = await SportService.getSportById(req.params.id);
    return res.status(200).json({ success: true, data: sport });
  } catch (error) {
    next(error);
  }
};

const createSport = async (req, res, next) => {
  try {
    const errors = validateSport(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    const sport = await SportService.createSport(req.body);
    return res.status(201).json({ success: true, message: 'Sport created', data: sport });
  } catch (error) {
    next(error);
  }
};

const updateSport = async (req, res, next) => {
  try {
    const sport = await SportService.updateSport(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Sport updated', data: sport });
  } catch (error) {
    next(error);
  }
};

const deleteSport = async (req, res, next) => {
  try {
    await SportService.deleteSport(req.params.id);
    return res.status(200).json({ success: true, message: 'Sport deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSports,
  getSportById,
  createSport,
  updateSport,
  deleteSport,
};
