const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 3000;

const formRoutes = require("./routes/formRoutes");
const taskRoutes = require("./routes/taskRoutes");

app.use(express.json());

app.use("/api/form", formRoutes);
app.use("/api/tasks", taskRoutes);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use((err, req, res, next) => {
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
