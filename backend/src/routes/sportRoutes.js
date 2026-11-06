const express = require('express');
const { getAllSports, getSportById } = require('../controllers/sportController');

const router = express.Router();

// Sports catalog is fixed — read-only endpoints only.
// Create / update / delete are intentionally disabled.
router.get('/', getAllSports);
router.get('/:id', getSportById);

module.exports = router;
