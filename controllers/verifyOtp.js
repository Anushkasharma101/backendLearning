const pool = require('../db');

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP are required" });
    }

    // Fetch OTP record
    const result = await pool.query(
      'SELECT * FROM password_resets WHERE email=$1 AND otp=$2 ORDER BY id DESC LIMIT 1',
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    const otpRecord = result.rows[0];

    // Check expiry
    if (new Date() > otpRecord.expires_at) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    // OTP is valid
    return res.status(200).json({ msg: "OTP verified successfully" });

  } catch (err) {
    console.error("Error in verifyOtp:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
