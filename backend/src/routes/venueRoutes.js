const express = require('express');
const venueController = require('../controllers/venueController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', venueController.getAllVenues);
router.get('/:id', venueController.getVenueById);

router.post(
  '/',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  venueController.createVenue
);

router.put(
  '/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  venueController.updateVenue
);

router.delete(
  '/:id',
  authenticateToken,
  requireRoles(['ADMIN']),
  venueController.deleteVenue
);

module.exports = router;
