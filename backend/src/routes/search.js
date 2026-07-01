const express = require('express');
const { searchTailors } = require('../controllers/tailorController');

const router = express.Router();

router.get('/tailors', searchTailors);

module.exports = router;
