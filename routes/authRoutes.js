const express = require('express');
const {
  register,
  login
} = require('../controllers/authController');

const { requestOtp } = require('../controllers/requestOtp');
const { verifyOtp } = require('../controllers/verifyOtp');
const { resetPassword } = require('../controllers/resetPassword');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Auth routes
router.post('/register', register); 
router.post('/login', login);

// OTP routes
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.patch('/reset-password', resetPassword);

module.exports = router;
