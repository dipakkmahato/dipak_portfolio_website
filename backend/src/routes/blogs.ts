import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { blogs as fallbackBlogs } from "../lib/fallback-site-data";

const router = express.Router();

async function waitForMongoConnection(timeoutMs = 15000) {
  const state = Number(mongoose.connection.readyState);
  if (state === 1) return true;
  if (state !== 2) return false;

  try {
    await Promise.race([
      mongoose.connection.asPromise(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("MongoDB connection timed out")), timeoutMs)),
    ]);
    return Number(mongoose.connection.readyState) === 1;
  } catch {
    return false;
  }
}

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

function withFallbackBlogLinks(docs: RawDoc[]): Blog[] {
  const bySlug = new Map(fallbackBlogs.map((blog) => [blog.slug, blog] as const));

  return docs.map((doc) => {
    const blog = stripId(doc) as Blog;
    const fallback = bySlug.get(blog.slug);
    return {
      ...fallback,
      ...blog,
    };
  });
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const docs = await collection<RawDoc>("blogs").find({}).toArray();
    const blogs = toJSON(withFallbackBlogLinks(docs));
    return res.json({ ok: true, blogs });
  } catch {
    return res.json({ ok: true, blogs: toJSON(fallbackBlogs) });
  }
});

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const doc = await collection<RawDoc>("blogs").findOne({ slug: req.params.slug });
    if (doc) {
      return res.json({ ok: true, blog: toJSON(stripId(doc)) as Blog });
    }
  } catch {
    // Fall through to the static fallback below.
  }

  const fallback = fallbackBlogs.find((blog) => blog.slug === req.params.slug);
  if (!fallback) {
    return res.status(404).json({ ok: false, error: "Blog not found" });
  }

  return res.json({ ok: true, blog: toJSON(fallback) as Blog });
});

export default router;
