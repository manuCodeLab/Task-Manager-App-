import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = Router();

function issueToken(user) {
  const id = user._id.toString();

  return jwt.sign(
    { id, email: user.email, name: user.name },
    process.env.JWT_SECRET || "dev-secret-change-me",
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Name, valid email, and a 6+ character password are required." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10)
    });

    res.status(201).json({ user: publicUser(user), token: issueToken(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({ user: publicUser(user), token: issueToken(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
