const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, address } = req.body;

    // ✅ Validations
    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ msg: "Name must be between 20-60 characters" });
    }
    if (address && address.length > 400) {
      return res.status(400).json({ msg: "Address max length is 400 chars" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        msg: "Password must be 8-16 chars, include 1 uppercase & 1 special char"
      });
    }

    // ✅ Role Mapping
    const roleMap = {
      "System Administrator": "ADMIN",
      "User": "NORMAL",
      "Store Owner": "OWNER"
    };
    const dbRole = roleMap[role] || "NORMAL";

    // ✅ Check if email already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert into DB
    const result = await pool.query(
      `INSERT INTO users (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, address, dbRole]
    );

    res.status(201).json({
      msg: "User registered successfully",
      user: result.rows[0]
    });

  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // ✅ Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const user = result.rows[0];

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ Create JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '1d' } // 30 days if checked
    );

    // ✅ Set token as HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30d or 1d
    });

    res.json({
      msg: "Login successful",
      token,
      user: { id: user.id, name: user.name, role: user.role },
      rememberMe
    });

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};
