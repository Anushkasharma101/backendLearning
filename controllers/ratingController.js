const pool = require('../db');

exports.submitRating = async (req, res) => {
  try {
    const { store_id, rating } = req.body;
    const userId = req.user.userId;

    if (!store_id || rating < 1 || rating > 5)
      return res.status(400).json({ msg: "Invalid store ID or rating" });

    // Check if rating already exists
    const existing = await pool.query(
      'SELECT * FROM ratings WHERE user_id=$1 AND store_id=$2',
      [userId, store_id]
    );
    if (existing.rows.length > 0)
      return res.status(400).json({ msg: "Rating already exists, use update" });

    const result = await pool.query(
      'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING *',
      [userId, store_id, rating]
    );
    res.json({ msg: "Rating submitted", rating: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updateRating = async (req, res) => {
  try {
    const ratingId = req.params.id;
    const { rating } = req.body;
    const userId = req.user.userId;

    if (rating < 1 || rating > 5)
      return res.status(400).json({ msg: "Invalid rating" });

    const existing = await pool.query(
      'SELECT * FROM ratings WHERE id=$1 AND user_id=$2',
      [ratingId, userId]
    );
    if (existing.rows.length === 0)
      return res.status(404).json({ msg: "Rating not found" });

    await pool.query(
      'UPDATE ratings SET rating=$1 WHERE id=$2',
      [rating, ratingId]
    );
    res.json({ msg: "Rating updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
