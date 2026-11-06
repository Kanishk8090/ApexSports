const express = require('express');
const {
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
} = require('../controllers/playerController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllPlayers);
router.get('/:id', getPlayerById);
router.post('/', authenticateToken, requireRoles(['ADMIN', 'ORGANIZER']), createPlayer);
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'ORGANIZER']), updatePlayer);
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), deletePlayer);

module.exports = router;
