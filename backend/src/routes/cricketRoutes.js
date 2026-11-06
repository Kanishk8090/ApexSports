const express = require('express');
const cricketController = require('../controllers/cricketController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Public route: Match Centre scorecard & commentary
router.get('/', cricketController.getCricketDetails);
router.get('/scorecard', cricketController.getCricketDetails);

// Organizer / Admin scoring routes
router.post(
  '/innings',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  cricketController.startInnings
);

router.post(
  '/deliveries',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  cricketController.recordDelivery
);

router.post(
  '/undo',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  cricketController.undoDelivery
);

router.put(
  '/active-players',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  cricketController.updateActivePlayers
);

router.post(
  '/end-innings',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  cricketController.endInnings
);

router.post(
  '/finalize',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  cricketController.finalizeMatch
);

module.exports = router;

