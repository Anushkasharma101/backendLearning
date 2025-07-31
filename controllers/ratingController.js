const pool = require('../db');

exports.submitRating = async (req, res) => {
  try {
    const { store_id, rating } = req.body;
    const userId = req.user.userId;

    if (!store_id || rating < 1 || rating > 5)
      return res.status(400).json({ msg: "Invalid store ID or rating" });

    const check = await pool.query(
      "SELECT id FROM ratings WHERE user_id=$1 AND store_id=$2",
      [userId, store_id]
    );

    if (check.rows.length > 0) {
      // Update
      await pool.query(
        "UPDATE ratings SET rating=$1, created_at=NOW() WHERE user_id=$2 AND store_id=$3",
        [rating, userId, store_id]
      );
      return res.json({ msg: "Rating updated" });
    } else {
      // Insert
      const result = await pool.query(
        'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) RETURNING *',
        [userId, store_id, rating]
      );
      return res.json({ msg: "Rating submitted", rating: result.rows[0] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.updateRating = async (req, res) => {
  try {
    const { store_id, rating } = req.body;
    const userId = req.user.userId;

    if (!store_id || rating < 1 || rating > 5)
      return res.status(400).json({ msg: "Invalid store ID or rating" });

    const check = await pool.query(
      "SELECT id FROM ratings WHERE user_id=$1 AND store_id=$2",
      [userId, store_id]
    );

    if (check.rows.length === 0)
      return res.status(404).json({ msg: "No existing rating found to update" });

    await pool.query(
      "UPDATE ratings SET rating=$1, created_at=NOW() WHERE user_id=$2 AND store_id=$3",
      [rating, userId, store_id]
    );

    res.json({ msg: "Rating updated successfully" });
  } catch (err) {
    console.error("Update rating error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};