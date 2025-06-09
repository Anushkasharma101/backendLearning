const express = require("express");
const router = express.Router();
const { tasks } = require("../data/memoryStore");

// GET all tasks with optional pagination
router.get("/", (req, res) => {
  let result = tasks;

  const { page, limit, title } = req.query;
  if (title) result = result.filter(task => task.title.includes(title));

  if (page && limit) {
    const start = (page - 1) * limit;
    const end = start + Number(limit);
    result = result.slice(start, end);
  }

  res.json(result);
});

// GET task by ID
router.get("/:id", (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// POST create task
router.post("/", (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ error: "Title and description are required" });

  const newTask = { id: Date.now().toString(), title, description };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT update task
router.put("/:id", (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ error: "Title and description are required" });

  task.title = title;
  task.description = description;
  res.json(task);
});

// DELETE task
router.delete("/:id", (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Task not found" });

  tasks.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
