const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { submitRating, updateRating } = require('../controllers/ratingController');

const router = express.Router();

router.post('/', authenticate, submitRating); // Submit rating
router.put('/:id', authenticate, updateRating); // Update rating

module.exports = router;
