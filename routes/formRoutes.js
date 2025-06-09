const express = require("express");
const router = express.Router();
const validateForm = require("../middleware/validateForm");

const formDataList = [];

// POST: Submit new form data
router.post("/", validateForm, (req, res) => {
  const { firstName, lastName, gender, language, email } = req.body;
  const newEntry = {
    id: Date.now().toString(),
    name: `${firstName} ${lastName}`,
    gender,
    language: Array.isArray(language) ? language.join(", ") : language,
    email,
  };
  formDataList.push(newEntry);
  res.status(201).json({ message: "Form submitted", data: newEntry });
});

// GET: Return all form submissions
router.get("/", (req, res) => {
  res.json(formDataList);
});

module.exports = router;
