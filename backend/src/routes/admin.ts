import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { requireAdmin } from "../middleware/auth";

const router = express.Router();

type RawDoc = Record<string, unknown> & { _id: string };

type SiteContent = {
  profile: Record<string, unknown>;
  services: unknown[];
  serviceDetails: Record<string, unknown>;
  education: unknown[];
  skills: unknown[];
  experience: unknown[];
  projects: unknown[];
  accomplishments: unknown[];
  blogUnits: unknown[];
  updatedAt: string;
};

type SiteUpdatePayload = {
  profile?: Record<string, unknown>;
  services?: unknown[];
  projects?: unknown[];
};

type BlogUpdatePayload = {
  blogs?: Array<{
    slug?: unknown;
    link?: unknown;
  }>;
};

type ContactSubmissionRecord = {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  userAgent: string | null;
  _id: string;
};

type BlogRecord = {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  link?: string;
  excerpt?: string;
  cover?: string;
  body?: unknown[];
  _id: string;
};

const SITE_META_ID = "site_content";

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

function db() {
  const connectionDb = mongoose.connection.db;
  if (!connectionDb) throw new Error("MongoDB connection is not ready");
  return connectionDb;
}

function collection<T extends RawDoc>(name: string) {
  return db().collection<T>(name);
}

function stripId(doc: RawDoc | null | undefined): Record<string, unknown> | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}

function toJSON<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function emptySiteContent(): SiteContent {
  return {
    profile: {},
    services: [],
    serviceDetails: {},
    education: [],
    skills: [],
    experience: [],
    projects: [],
    accomplishments: [],
    blogUnits: [],
    updatedAt: new Date().toISOString(),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeSocials(input: unknown, current: Record<string, unknown>): Record<string, unknown> {
  if (!isPlainObject(input)) return current;

  const next = { ...current };
  for (const [key, value] of Object.entries(input)) {
    const normalized = normalizeString(value);
    if (normalized === null) {
      delete next[key];
    } else {
      next[key] = normalized;
    }
  }
  return next;
}

function normalizeServices(input: unknown, current: unknown[]): unknown[] {
  if (!Array.isArray(input)) return current;

  return input.map((service, index) => {
    if (!isPlainObject(service)) {
      return current[index] ?? service;
    }

    const currentService = isPlainObject(current[index]) ? current[index] : {};
    const nextService: Record<string, unknown> = {
      ...currentService,
      ...service,
    };

    for (const key of ["title", "icon", "color", "detailKey"] as const) {
      if (key in nextService) {
        const normalized = normalizeString(nextService[key]);
        if (normalized === null) {
          delete nextService[key];
        } else {
          nextService[key] = normalized;
        }
      }
    }

    return nextService;
  });
}

function normalizeProjects(input: unknown, current: unknown[]): unknown[] {
  if (!Array.isArray(input)) return current;

  return input.map((project, index) => {
    if (!isPlainObject(project)) {
      return current[index] ?? project;
    }

    const currentProject = isPlainObject(current[index]) ? current[index] : {};
    const nextProject: Record<string, unknown> = {
      ...currentProject,
      ...project,
    };

    if ("link" in nextProject) {
      const normalizedLink = normalizeString(nextProject.link);
      if (normalizedLink === null) {
        delete nextProject.link;
      } else {
        nextProject.link = normalizedLink;
      }
    }

    if (typeof nextProject.title !== "string") {
      nextProject.title = String(nextProject.title ?? "").trim();
    }

    return nextProject;
  });
}

function normalizeBlogUpdates(input: unknown) {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => {
      if (!isPlainObject(entry)) return null;
      const slug = normalizeString(entry.slug);
      if (!slug) return null;
      return {
        slug,
        link: normalizeString(entry.link),
      };
    })
    .filter((entry): entry is { slug: string; link: string | null } => Boolean(entry));
}

async function readSiteContent(): Promise<SiteContent> {
  const [
    metaDoc,
    profileDoc,
    servicesDoc,
    serviceDetailsDoc,
    educationDoc,
    skillsDoc,
    experienceDoc,
    projectsDoc,
    accomplishmentsDoc,
    blogUnitsDoc,
    legacyDoc,
  ] = await Promise.all([
    collection<RawDoc>("site_content").findOne({ _id: SITE_META_ID }),
    collection<RawDoc>("profile").findOne({ _id: "profile" }),
    collection<RawDoc>("services").findOne({ _id: "services" }),
    collection<RawDoc>("serviceDetails").findOne({ _id: "serviceDetails" }),
    collection<RawDoc>("education").findOne({ _id: "education" }),
    collection<RawDoc>("skills").findOne({ _id: "skills" }),
    collection<RawDoc>("experience").findOne({ _id: "experience" }),
    collection<RawDoc>("projects").findOne({ _id: "projects" }),
    collection<RawDoc>("accomplishments").findOne({ _id: "accomplishments" }),
    collection<RawDoc>("blogUnits").findOne({ _id: "blogUnits" }),
    collection<RawDoc>("site_content").findOne({ _id: "site" }),
  ]);

  const fallback = emptySiteContent();

  if (legacyDoc) {
    const fallbackUpdatedAt = new Date().toISOString();
    const legacy = stripId(legacyDoc) ?? {};
    return toJSON({
      ...fallback,
      profile: (legacy.profile as Record<string, unknown>) ?? fallback.profile,
      services: (legacy.services as unknown[]) ?? fallback.services,
      serviceDetails: (legacy.serviceDetails as Record<string, unknown>) ?? fallback.serviceDetails,
      education: (legacy.education as unknown[]) ?? fallback.education,
      skills: (legacy.skills as unknown[]) ?? fallback.skills,
      experience: (legacy.experience as unknown[]) ?? fallback.experience,
      projects: (legacy.projects as unknown[]) ?? fallback.projects,
      accomplishments: (legacy.accomplishments as unknown[]) ?? fallback.accomplishments,
      blogUnits: (legacy.blogUnits as unknown[]) ?? fallback.blogUnits,
      updatedAt: String(legacy.updatedAt ?? fallbackUpdatedAt),
    });
  }

  return toJSON({
    ...fallback,
    profile: stripId(profileDoc) ?? fallback.profile,
    services: (servicesDoc?.items as unknown[] | undefined) ?? fallback.services,
    serviceDetails: stripId(serviceDetailsDoc) ?? fallback.serviceDetails,
    education: (educationDoc?.items as unknown[] | undefined) ?? fallback.education,
    skills: (skillsDoc?.items as unknown[] | undefined) ?? fallback.skills,
    experience: (experienceDoc?.items as unknown[] | undefined) ?? fallback.experience,
    projects: (projectsDoc?.items as unknown[] | undefined) ?? fallback.projects,
    accomplishments:
      (accomplishmentsDoc?.items as unknown[] | undefined) ?? fallback.accomplishments,
    blogUnits: (blogUnitsDoc?.items as unknown[] | undefined) ?? fallback.blogUnits,
    updatedAt: String(metaDoc?.updatedAt ?? fallback.updatedAt),
  });
}

async function writeSiteContent(content: SiteContent) {
  const updatedAt = new Date(content.updatedAt ?? new Date()).toISOString();
  const nextContent: SiteContent = {
    ...content,
    updatedAt,
  };

  await Promise.all([
    collection<RawDoc>("site_content").replaceOne(
      { _id: SITE_META_ID },
      { _id: SITE_META_ID, updatedAt },
      { upsert: true },
    ),
    collection<RawDoc>("profile").replaceOne(
      { _id: "profile" },
      { _id: "profile", ...nextContent.profile },
      { upsert: true },
    ),
    collection<RawDoc>("services").replaceOne(
      { _id: "services" },
      { _id: "services", items: nextContent.services },
      { upsert: true },
    ),
    collection<RawDoc>("serviceDetails").replaceOne(
      { _id: "serviceDetails" },
      { _id: "serviceDetails", ...nextContent.serviceDetails },
      { upsert: true },
    ),
    collection<RawDoc>("education").replaceOne(
      { _id: "education" },
      { _id: "education", items: nextContent.education },
      { upsert: true },
    ),
    collection<RawDoc>("skills").replaceOne(
      { _id: "skills" },
      { _id: "skills", items: nextContent.skills },
      { upsert: true },
    ),
    collection<RawDoc>("experience").replaceOne(
      { _id: "experience" },
      { _id: "experience", items: nextContent.experience },
      { upsert: true },
    ),
    collection<RawDoc>("projects").replaceOne(
      { _id: "projects" },
      { _id: "projects", items: nextContent.projects },
      { upsert: true },
    ),
    collection<RawDoc>("accomplishments").replaceOne(
      { _id: "accomplishments" },
      { _id: "accomplishments", items: nextContent.accomplishments },
      { upsert: true },
    ),
    collection<RawDoc>("blogUnits").replaceOne(
      { _id: "blogUnits" },
      { _id: "blogUnits", items: nextContent.blogUnits },
      { upsert: true },
    ),
  ]);

  return nextContent;
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

router.get("/site", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const site = await readSiteContent();
    return res.json({ ok: true, site });
  } catch (error) {
    console.error("Failed to fetch admin site content from MongoDB.", error);
    return res.status(500).json({ ok: false, error: "Failed to load site content" });
  }
});

router.patch("/site", requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = req.body as SiteUpdatePayload | undefined;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ ok: false, error: "Invalid site update payload" });
    }

    const current = await readSiteContent();
    const nextProfile = isPlainObject(body.profile)
      ? {
          ...current.profile,
          ...body.profile,
          socials: normalizeSocials(
            body.profile.socials,
            (current.profile.socials as Record<string, unknown>) ?? {},
          ),
        }
      : current.profile;

    const nextSite = await writeSiteContent({
      ...current,
      profile: nextProfile,
      services: normalizeServices(body.services, current.services),
      projects: normalizeProjects(body.projects, current.projects),
      updatedAt: new Date().toISOString(),
    });

    return res.json({ ok: true, site: nextSite });
  } catch (error) {
    console.error("Failed to update site content in MongoDB.", error);
    return res.status(500).json({ ok: false, error: "Failed to update site content" });
  }
});

router.get("/blogs", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const docs = await collection<RawDoc>("blogs").find({}).sort({ title: 1 }).toArray();
    return res.json({
      ok: true,
      blogs: toJSON(docs.map(stripId).filter(Boolean)) as BlogRecord[],
    });
  } catch (error) {
    console.error("Failed to fetch blogs for admin from MongoDB.", error);
    return res.status(500).json({ ok: false, error: "Failed to load blogs" });
  }
});

router.patch("/blogs", requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = req.body as BlogUpdatePayload | undefined;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ ok: false, error: "Invalid blog update payload" });
    }

    const updates = normalizeBlogUpdates(body.blogs);
    if (updates.length === 0) {
      return res.status(400).json({ ok: false, error: "No blog updates provided" });
    }

    const results = await Promise.all(
      updates.map(async (entry) => {
        const update = entry.link
          ? { $set: { link: entry.link } }
          : { $unset: { link: "" } };
        const result = await collection<RawDoc>("blogs").updateOne({ slug: entry.slug }, update);
        return { slug: entry.slug, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
      }),
    );

    return res.json({ ok: true, results });
  } catch (error) {
    console.error("Failed to update blog links in MongoDB.", error);
    return res.status(500).json({ ok: false, error: "Failed to update blog links" });
  }
});

export default router;
