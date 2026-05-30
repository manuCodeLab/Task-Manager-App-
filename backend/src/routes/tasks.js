import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Task, stages } from "../models/Task.js";

const router = Router();

router.use(requireAuth);

function publicTask(task) {
  return {
    id: task._id.toString(),
    userId: task.userId.toString(),
    title: task.title,
    description: task.description,
    stage: task.stage,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

function sanitizeTaskInput(body, partial = false) {
  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const stage = typeof body.stage === "string" ? body.stage : undefined;

  if (!partial && !title) {
    return { error: "Task title is required." };
  }

  if (title !== undefined && !title) {
    return { error: "Task title cannot be empty." };
  }

  if (stage !== undefined && !stages.includes(stage)) {
    return { error: "Task stage must be Todo, In Progress, or Done." };
  }

  return {
    task: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(stage !== undefined ? { stage } : {})
    }
  };
}

router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ updatedAt: -1 });

    res.json({ tasks: tasks.map(publicTask) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { task: input, error } = sanitizeTaskInput(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const task = await Task.create({
      userId: req.user.id,
      title: input.title,
      description: input.description || "",
      stage: input.stage || "Todo"
    });

    res.status(201).json({ task: publicTask(task) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { task: input, error } = sanitizeTaskInput(req.body, true);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      input,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ task: publicTask(task) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
