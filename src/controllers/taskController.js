import Task from "../models/Task.js";

export async function getTasks(req, res) {
  const tasks = await Task.find().sort({
    createdAt: -1
  });

  res.json(tasks);
}

export async function createTask(req, res) {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      error: "Task text is required"
    });
  }

  const task = await Task.create({
    text: text.trim(),
    completed: false
  });

  res.json(task);
}

export async function updateTask(req, res) {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      completed: req.body.completed
    },
    {
      new: true
    }
  );

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  res.json(task);
}

export async function deleteTask(req, res) {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  res.json({
    message: "Task deleted"
  });
}