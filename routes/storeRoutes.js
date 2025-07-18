const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { getAllStores, searchStores, ownerDashboard } = require('../controllers/storeController');

const router = express.Router();

// Normal users: view stores & search
router.get('/', authenticate, getAllStores);
router.get('/search', authenticate, searchStores);

// Store Owner dashboard
router.get('/owner/dashboard', authenticate, ownerDashboard);

module.exports = router;
