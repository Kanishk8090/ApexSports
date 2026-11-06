const express = require('express');
const { getAllUsers, updateUserRole } = require('../controllers/userController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// System Administrator only routes
router.use(authenticateToken);
router.use(requireRoles(['ADMIN']));

router.get('/', getAllUsers);
router.put('/:id/role', updateUserRole);
router.patch('/:id/role', updateUserRole);

module.exports = router;
