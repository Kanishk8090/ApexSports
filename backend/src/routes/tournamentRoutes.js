const express = require('express');
const tournamentController = require('../controllers/tournamentController');
const matchController = require('../controllers/matchController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// Public read routes
router.get('/', tournamentController.getAllTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.get('/:id/teams', tournamentController.getTournamentTeams);
router.get('/:id/standings', matchController.getTournamentStandings);

// Protected routes (Admin / Organizer)
router.post(
  '/',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  tournamentController.createTournament
);

router.put(
  '/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  tournamentController.updateTournament
);

router.delete(
  '/:id',
  authenticateToken,
  requireRoles(['ADMIN']),
  tournamentController.deleteTournament
);

// Team registration in tournament
router.post(
  '/:id/teams',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  tournamentController.registerTeam
);

router.delete(
  '/:id/teams/:teamId',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  tournamentController.removeTeam
);

// Fixture Generation
router.post(
  '/:id/generate-fixtures',
  authenticateToken,
  requireRoles(['ADMIN', 'ORGANIZER']),
  matchController.generateTournamentFixtures
);

module.exports = router;
