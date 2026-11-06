const express = require('express');
const footballController = require('../controllers/footballController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Public routes: Match Centre details & events
router.get('/', footballController.getFootballDetails);
router.get('/summary', footballController.getFootballDetails);

// Organizer / Admin scoring routes
router.post(
  '/start',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  footballController.startMatch
);

router.post(
  '/clock',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  footballController.updateClock
);

router.post(
  '/events',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  footballController.recordEvent
);

router.delete(
  '/events/:eventId',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  footballController.undoEvent
);

router.post(
  '/lineups',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  footballController.saveLineups
);

router.put(
  '/stats',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  footballController.updateStats
);

router.post(
  '/finalize',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  footballController.finalizeMatch
);

module.exports = router;

