const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { addUser, addStore } = require('../controllers/adminController');
const { getAdminDashboard ,getAllReviewers} = require('../controllers/adminController');

const router = express.Router();

router.post('/add-user', authenticate, authorizeRoles('ADMIN'), addUser);
router.post('/add-store', authenticate, authorizeRoles('ADMIN'), addStore);
router.get('/getallstores', authenticate, authorizeRoles('ADMIN'), getAdminDashboard);
router.get('/reviewers', authenticate, authorizeRoles('ADMIN'), getAllReviewers);

module.exports = router;
