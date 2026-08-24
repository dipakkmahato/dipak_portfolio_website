import express, { Request, Response } from "express";
import mongoose from "mongoose";
import type { Collection, Document } from "mongodb";
import { requireAdmin } from "../middleware/auth";

const router = express.Router();

type ContactSubmissionRecord = {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  userAgent: string | null;
  _id: unknown;
};

function collection<T extends Document>(name: string): Collection<T> {
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) throw new Error("MongoDB connection is not ready");
  return connectionDb.collection<T>(name);
}

router.get("/contact-submissions", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const docs = await collection<ContactSubmissionRecord>("contact_submissions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({
      ok: true,
      submissions: docs.map((doc) => {
        const { _id, ...rest } = doc;
        return {
          _id: String(_id),
          ...rest,
        };
      }),
    });
  } catch (error) {
    console.error("Failed to fetch contact submissions from MongoDB.", error);
    return res.status(500).json({ ok: false, error: "Failed to load contact submissions" });
  }
});

export default router;
