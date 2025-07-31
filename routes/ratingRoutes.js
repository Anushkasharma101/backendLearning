const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { submitRating } = require('../controllers/ratingController');
const { updateRating } = require('../controllers/ratingController')

const router = express.Router();

router.post('/', authenticate, submitRating); 
router.post('/update', authenticate, updateRating); 

module.exports = router;
