import express, { Request, Response } from "express";
import mongoose from "mongoose";

const router = express.Router();

type RawDoc = Record<string, unknown> & { _id: string };

type Blog = Record<string, unknown> & {
  slug: string;
  title: string;
  category: string;
  tags: string[];
};

function db() {
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) throw new Error("MongoDB connection is not ready");
  return connectionDb;
}

function collection<T extends RawDoc>(name: string) {
  return db().collection<T>(name);
}

function toJSON<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function stripId(doc: RawDoc) {
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const docs = await collection<RawDoc>("blogs").find({}).toArray();
    return res.json({ ok: true, blogs: toJSON(docs.map(stripId)) as Blog[] });
  } catch (error) {
    console.error("Failed to fetch blogs from MongoDB.", error);
    return res.status(500).json({ ok: false, error: "Failed to fetch blogs" });
  }
});

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const doc = await collection<RawDoc>("blogs").findOne({ slug: req.params.slug });
    if (!doc) {
      return res.status(404).json({ ok: false, error: "Blog not found" });
    }

    return res.json({ ok: true, blog: toJSON(stripId(doc)) as Blog });
  } catch (error) {
    console.error("Failed to fetch blog by slug from MongoDB.", error);
    return res.status(500).json({ ok: false, error: "Failed to fetch blog" });
  }
});

export default router;
