const pool = require('../db');
const bcrypt = require('bcrypt');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;

// ✅ Middleware check: Only Admin
const isAdmin = (req) => req.user && req.user.role === 'ADMIN';

// ✅ Add User
exports.addUser = async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ msg: "Access denied: Admin only" });

    const { name, email, password, address, role } = req.body;

    if (!name || name.length < 20 || name.length > 60)
      return res.status(400).json({ msg: "Name must be 20-60 characters" });
    if (!emailRegex.test(email))
      return res.status(400).json({ msg: "Invalid email format" });
    if (!passwordRegex.test(password))
      return res.status(400).json({ msg: "Password must be 8-16 chars, include 1 uppercase & 1 special char" });
    if (address && address.length > 400)
      return res.status(400).json({ msg: "Address too long" });

    const allowedRoles = ['ADMIN', 'NORMAL', 'OWNER'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ msg: `Role must be one of: ${allowedRoles.join(', ')}` });
    }

    // Check if email exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    console.log("rows",userCheck.rows.length);
    
    if (userCheck.rows.length > 0)
      return res.status(400).json({ msg: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, address, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [name, email, hashedPassword, address, role]
    );

    res.status(201).json({ msg: "User added successfully", user: result.rows[0] });
  } catch (err) {
    console.error("Add User Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Add Store
exports.addStore = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: "Access denied: Admin only" });
    }

    const { name, address, ownerEmail } = req.body;

    // ✅ Validate inputs
    if (!name) return res.status(400).json({ msg: "Store name is required" });
    if (!ownerEmail || !emailRegex.test(ownerEmail)) {
      return res.status(400).json({ msg: "Valid owner email required" });
    }

    // ✅ Check if owner exists in users table and is an OWNER
    const ownerUser = await pool.query(
      'SELECT id, role FROM users WHERE LOWER(email) = LOWER($1)',
      [ownerEmail]
    );

    if (ownerUser.rows.length === 0) {
      return res.status(400).json({ msg: "Owner email not found in users" });
    }

    if (ownerUser.rows[0].role !== 'OWNER') {
      return res.status(400).json({ msg: "This user is not an OWNER" });
    }

    const ownerId = ownerUser.rows[0].id;

    // ✅ Check if this owner already has a store
    const existingStore = await pool.query(
      'SELECT id FROM stores WHERE owner_id = $1',
      [ownerId]
    );

    if (existingStore.rows.length > 0) {
      return res.status(400).json({ msg: "This owner already has a store" });
    }

    // ✅ Insert store into the database
    const result = await pool.query(
      `INSERT INTO stores (name, address, owner_id, owner_email)
       VALUES ($1, $2, $3, $4) RETURNING id, name, address, owner_email`,
      [name, address || null, ownerId, ownerEmail]
    );

    res.status(201).json({ msg: "Store added successfully", store: result.rows[0] });

  } catch (err) {
    console.error("Add Store Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // ✅ Fetch total counts
    const totalUsersQuery = `SELECT COUNT(*) AS total_users FROM users;`;
    const totalStoresQuery = `SELECT COUNT(*) AS total_stores FROM stores;`;
    const totalReviewersQuery = `SELECT COUNT(DISTINCT user_id) AS total_reviewers FROM ratings;`;

    const [usersResult, storesResult, reviewersResult] = await Promise.all([
      pool.query(totalUsersQuery),
      pool.query(totalStoresQuery),
      pool.query(totalReviewersQuery)
    ]);

    const total_users = parseInt(usersResult.rows[0].total_users);
    const total_stores = parseInt(storesResult.rows[0].total_stores);
    const total_reviewers = parseInt(reviewersResult.rows[0].total_reviewers);

    // ✅ Fetch store details with avg rating
    const storesQuery = `
      SELECT 
        s.id AS store_id,
        s.name AS store_name,
        s.address,
        COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS avg_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      GROUP BY s.id;
    `;

    const storeDetails = await pool.query(storesQuery);

    // ✅ Final response
    res.json({
      total_users,
      total_stores,
      total_reviewers,
      stores: storeDetails.rows
    });

  } catch (err) {
    console.error("Admin Dashboard Error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getAllReviewers = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { name, email, role, address, sortBy, sortOrder } = req.query;

    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.address,
        u.role,
        r.store_id,
        r.rating
      FROM users u
      LEFT JOIN ratings r ON u.id = r.user_id
      WHERE 1=1
    `;

    let params = [];
    if (name) {
      params.push(`%${name}%`);
      query += ` AND u.name ILIKE $${params.length}`;
    }
    if (email) {
      params.push(`%${email}%`);
      query += ` AND u.email ILIKE $${params.length}`;
    }
    if (role) {
      params.push(role.toUpperCase());
      query += ` AND u.role = $${params.length}`;
    }
    if (address) {
      params.push(`%${address}%`);
      query += ` AND u.address ILIKE $${params.length}`;
    }

    // ✅ Sorting
    const allowedSortFields = ['name', 'email', 'role', 'address'];
    const allowedSortOrder = ['ASC', 'DESC'];

    if (sortBy && allowedSortFields.includes(sortBy.toLowerCase())) {
      query += ` ORDER BY u.${sortBy} ${allowedSortOrder.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC'}`;
    } else {
      query += ` ORDER BY u.name ASC`; // Default sort
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Get Reviewers Error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};



