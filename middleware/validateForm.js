module.exports = (req, res, next) => {
  const { firstName, lastName, gender, language, email } = req.body;
  if (!firstName || !lastName || !gender || !language || !email) {
    return res.status(400).json({ error: "All fields are required." });
  }
  next();
};
