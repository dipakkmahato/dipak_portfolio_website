import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/db";
import authRouter from "./routes/auth";
import adminRouter from "./routes/admin";
import blogsRouter from "./routes/blogs";
import contactRouter from "./routes/contact";
import cvRouter from "./routes/cv";
import siteRouter from "./routes/site";

const app = express();
const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(backendRoot, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });

// Connect to MongoDB
connectDB();

const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => res.send("API is running"));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/site", siteRouter);
app.use("/api/blogs", blogsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/admin", adminRouter);
app.use("/api/cv", cvRouter);

export default app;


