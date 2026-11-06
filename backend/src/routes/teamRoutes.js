const express = require('express');
const {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
} = require('../controllers/teamController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllTeams);
router.get('/:id', getTeamById);
router.post('/', authenticateToken, requireRoles(['ADMIN', 'ORGANIZER']), createTeam);
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'ORGANIZER']), updateTeam);
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), deleteTeam);

router.post('/:id/players', authenticateToken, requireRoles(['ADMIN', 'ORGANIZER']), addPlayerToTeam);
router.delete('/:id/players/:playerId', authenticateToken, requireRoles(['ADMIN', 'ORGANIZER']), removePlayerFromTeam);

module.exports = router;
