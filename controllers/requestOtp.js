const pool = require('../db');
const { sendEmail } = require('../utils/emailService'); 
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ msg: "Valid email is required" });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ msg: "Email not registered" });
    }

    // Check resend cooldown (from .env or default 60s)
    const resendCooldown = process.env.OTP_RESEND_COOLDOWN || 60;
    const lastOtp = await pool.query(
      'SELECT * FROM password_resets WHERE email=$1 ORDER BY id DESC LIMIT 1',
      [email]
    );

    if (lastOtp.rows.length > 0) {
      const lastSent = new Date(lastOtp.rows[0].last_sent_at);
      if ((Date.now() - lastSent.getTime()) / 1000 < resendCooldown) {
        return res.status(429).json({ msg: `Please wait ${resendCooldown} seconds before resending OTP` });
      }
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Insert OTP into DB
    console.log("Inserting OTP for:",email, otp, expiresAt)
    await pool.query(
      `INSERT INTO password_resets (email, otp, expires_at, last_sent_at)
       VALUES ($1, $2, $3, NOW())`,
      [email, otp, expiresAt]
    );

    console.log("OTP inserted successfully");

    // Send email
    await sendEmail(email, "Password Reset OTP", `Your OTP is ${otp}. It will expire in ${expiryMinutes} minutes.`);

    return res.json({
      msg: "OTP sent to your email",
      expires_in: expiryMinutes * 60, // for frontend timer
      resend_after: resendCooldown
    });

  } catch (err) {
    console.error("Request OTP Error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
