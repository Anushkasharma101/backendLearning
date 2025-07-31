const pool = require("../db");

// Get all stores with average rating and user's rating
exports.getAllStores = async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT 
        s.id, 
        s.name, 
        s.address,
        ROUND(COALESCE(AVG(r.rating), 0)::numeric, 2) AS avg_rating
        ur.user_rating,
        ur.rating_id
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      LEFT JOIN (
        SELECT DISTINCT ON (store_id)
          store_id, 
          rating AS user_rating, 
          id AS rating_id
        FROM ratings
        WHERE user_id = $1
        ORDER BY store_id, created_at DESC
      ) ur ON s.id = ur.store_id
      GROUP BY s.id, ur.user_rating, ur.rating_id;
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Search stores by name or address
exports.searchStores = async (req, res) => {
  try {
    const { name, address } = req.query;
    const userId = req.user.userId;

    let query = `
      SELECT s.id, s.name, s.address,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        (SELECT rating FROM ratings WHERE user_id=$1 AND store_id=s.id LIMIT 1) as user_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
    `;
    let conditions = [];
    let params = [userId];

    if (name) {
      conditions.push(`s.name ILIKE $${params.length + 1}`);
      params.push(`%${name}%`);
    }
    if (address) {
      conditions.push(`s.address ILIKE $${params.length + 1}`);
      params.push(`%${address}%`);
    }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " GROUP BY s.id";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Store Owner dashboard: users who rated + average rating
exports.ownerDashboard = async (req, res) => {
  try {
    if (req.user.role !== "OWNER")
      return res.status(403).json({ msg: "Access denied" });

    const ownerId = req.user.userId;
    const query = `
      SELECT 
        s.id AS store_id,
        s.name AS store_name,
        COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS avg_rating,    -- Average rating (rounded to 2 decimals)
        COUNT(DISTINCT r.user_id) AS total_reviewers,                  -- Total number of reviewers
        json_agg(
          json_build_object(
            'user_name', u.name, 
            'rating', r.rating
          )
        ) FILTER (WHERE r.rating IS NOT NULL) AS ratings              -- List of reviewers with rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE s.owner_id = $1
      GROUP BY s.id;
    `;

    const result = await pool.query(query, [ownerId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Owner Dashboard Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
