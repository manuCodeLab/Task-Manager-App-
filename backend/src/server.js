import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import { connectDatabase } from "./database.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const configuredOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin(origin, callback) {
      const allowsAnyOrigin = configuredOrigins.length === 0 || configuredOrigins.includes("*");
      const isVercelPreview = origin?.endsWith(".vercel.app");

      if (!origin || allowsAnyOrigin || configuredOrigins.includes(origin) || isVercelPreview) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "task-manager-api", database: "mongodb" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Task manager API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start API:", error.message);
    process.exit(1);
  });
