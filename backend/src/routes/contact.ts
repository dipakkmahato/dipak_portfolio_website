import express, { Request, Response } from "express";
import mongoose from "mongoose";
import type { Collection, Document } from "mongodb";
import { rateLimit } from "../middleware/rateLimit";

const router = express.Router();
const contactRateLimit = rateLimit({
  windowMs: Number(process.env.CONTACT_RATE_WINDOW_MS ?? 60 * 1000),
  limit: Number(process.env.CONTACT_RATE_LIMIT ?? 10),
  keyPrefix: "contact-submit",
  message: "Too many contact submissions. Please try again later.",
});

type ContactSubmissionRecord = {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  userAgent: string | null;
};

function collection<T extends Document>(name: string): Collection<T> {
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) throw new Error("MongoDB connection is not ready");
  return connectionDb.collection<T>(name);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/", contactRateLimit, async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim();
    const subject = String(req.body?.subject ?? "").trim();
    const message = String(req.body?.message ?? "").trim();

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ ok: false, error: "All fields are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email address" });
    }

    const doc: ContactSubmissionRecord = {
      name,
      email,
      subject,
      message,
      createdAt: new Date(),
      userAgent: req.header("user-agent") ?? null,
    };

    const result = await collection<ContactSubmissionRecord>("contact_submissions").insertOne(
      doc as never,
    );

    return res.json({ ok: true, id: String(result.insertedId) });
  } catch (error) {
    console.error("Failed to save contact submission to MongoDB.", error);
    return res.status(500).json({ ok: false, error: "Failed to save your message" });
  }
});

export default router;


