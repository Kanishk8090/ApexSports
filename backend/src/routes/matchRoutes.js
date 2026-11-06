const express = require('express');
const matchController = require('../controllers/matchController');
const cricketRoutes = require('./cricketRoutes');
const footballRoutes = require('./footballRoutes');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// Mount Sport-Specific Live Scoring Sub-routers
router.use('/:matchId/cricket', cricketRoutes);
router.use('/:matchId/football', footballRoutes);

// Public routes
router.get('/', matchController.getAllMatches);
router.get('/:id', matchController.getMatchById);

// Protected routes (Admin / Organizer)
router.post(
  '/',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  matchController.createMatch
);

router.put(
  '/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  matchController.updateMatch
);

router.delete(
  '/:id',
  authenticateToken,
  requireRoles(['ADMIN']),
  matchController.deleteMatch
);

// Match Score & Result completion endpoint (Week 4)
router.post(
  '/:id/score',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  matchController.completeMatchWithScore
);

router.post(
  '/:id/complete',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  matchController.completeMatchWithScore
);

module.exports = router;
