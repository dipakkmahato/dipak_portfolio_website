import express, { Request, Response } from "express";
import mongoose from "mongoose";

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

const SITE_META_ID = "site_content";

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

async function readSiteContent(): Promise<SiteContent | null> {
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

  if (legacyDoc) {
    const fallbackUpdatedAt = new Date().toISOString();
    const legacy = stripId(legacyDoc) ?? {};
    return toJSON({
      profile: (legacy.profile as Record<string, unknown>) ?? {},
      services: (legacy.services as unknown[]) ?? [],
      serviceDetails: (legacy.serviceDetails as Record<string, unknown>) ?? {},
      education: (legacy.education as unknown[]) ?? [],
      skills: (legacy.skills as unknown[]) ?? [],
      experience: (legacy.experience as unknown[]) ?? [],
      projects: (legacy.projects as unknown[]) ?? [],
      accomplishments: (legacy.accomplishments as unknown[]) ?? [],
      blogUnits: (legacy.blogUnits as unknown[]) ?? [],
      updatedAt: String(legacy.updatedAt ?? fallbackUpdatedAt),
    });
  }

  if (
    !metaDoc ||
    !profileDoc ||
    !servicesDoc ||
    !serviceDetailsDoc ||
    !educationDoc ||
    !skillsDoc ||
    !experienceDoc ||
    !projectsDoc ||
    !accomplishmentsDoc ||
    !blogUnitsDoc
  ) {
    return null;
  }

  return toJSON({
    profile: stripId(profileDoc) ?? {},
    services: (servicesDoc.items as unknown[]) ?? [],
    serviceDetails: stripId(serviceDetailsDoc) ?? {},
    education: (educationDoc.items as unknown[]) ?? [],
    skills: (skillsDoc.items as unknown[]) ?? [],
    experience: (experienceDoc.items as unknown[]) ?? [],
    projects: (projectsDoc.items as unknown[]) ?? [],
    accomplishments: (accomplishmentsDoc.items as unknown[]) ?? [],
    blogUnits: (blogUnitsDoc.items as unknown[]) ?? [],
    updatedAt: String(metaDoc.updatedAt ?? new Date().toISOString()),
  });
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const site = await readSiteContent();
    if (!site) {
      return res
        .status(404)
        .json({ ok: false, error: "Site content has not been initialized yet" });
    }

    return res.json({ ok: true, site });
  } catch (error) {
    console.error("Failed to fetch site content from MongoDB.", error);
    return res.status(500).json({ ok: false, error: "Failed to fetch site content" });
  }
});

export default router;
