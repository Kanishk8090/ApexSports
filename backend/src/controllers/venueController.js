const venueService = require('../services/venueService');

const getAllVenues = async (req, res, next) => {
  try {
    const venues = await venueService.getAllVenues(req.query);
    res.json({ success: true, count: venues.length, data: venues });
  } catch (error) {
    next(error);
  }
};

const getVenueById = async (req, res, next) => {
  try {
    const venue = await venueService.getVenueById(req.params.id);
    res.json({ success: true, data: venue });
  } catch (error) {
    next(error);
  }
};

const createVenue = async (req, res, next) => {
  try {
    const venue = await venueService.createVenue(req.body);
    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: venue,
    });
  } catch (error) {
    next(error);
  }
};

const updateVenue = async (req, res, next) => {
  try {
    const venue = await venueService.updateVenue(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Venue updated successfully',
      data: venue,
    });
  } catch (error) {
    next(error);
  }
};

const deleteVenue = async (req, res, next) => {
  try {
    await venueService.deleteVenue(req.params.id);
    res.json({
      success: true,
      message: 'Venue deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
};
