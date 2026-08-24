import express, { Request, Response } from "express";
import mongoose from "mongoose";
import {
  accomplishments as fallbackAccomplishments,
  blogUnits as fallbackBlogUnits,
  education as fallbackEducation,
  experience as fallbackExperience,
  mobileAppDetails,
  dataAnalysisDetails,
  projects as fallbackProjects,
  profile as fallbackProfile,
  services as fallbackServices,
  skills as fallbackSkills,
  webDesignDetails,
  webDevDetails,
} from "../lib/fallback-site-data";

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
const FALLBACK_UPDATED_AT = new Date().toISOString();

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

function buildFallbackSite(): SiteContent {
  return toJSON({
    profile: fallbackProfile,
    services: fallbackServices,
    serviceDetails: {
      webDesign: webDesignDetails,
      webDev: webDevDetails,
      dataAnalysis: dataAnalysisDetails,
      mobileApp: mobileAppDetails,
    },
    education: fallbackEducation,
    skills: fallbackSkills,
    experience: fallbackExperience,
    projects: fallbackProjects,
    accomplishments: fallbackAccomplishments,
    blogUnits: fallbackBlogUnits,
    updatedAt: FALLBACK_UPDATED_AT,
  });
}

async function readSiteContent(): Promise<SiteContent> {
  const fallback = buildFallbackSite();

  try {
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
        updatedAt: String(legacy.updatedAt ?? fallback.updatedAt),
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
  } catch {
    return fallback;
  }
}

router.get("/", async (_req: Request, res: Response) => {
  const site = await readSiteContent();
  return res.json({ ok: true, site });
});

export default router;
