const pool = require('../db');
const bcrypt = require('bcrypt');

const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ msg: "Email, new password and confirm password are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        msg: "Password must be 8-16 chars, include at least 1 uppercase letter and 1 special character"
      });
    }

    // Check if email exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password=$1 WHERE email=$2', [hashedPassword, email]);

    // Delete OTP record after successful reset
    await pool.query('DELETE FROM password_resets WHERE email=$1', [email]);

    return res.status(200).json({ msg: "Password reset successful" });

  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
