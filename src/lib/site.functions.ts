import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type Blog } from "@/data/site";
import type { Db } from "mongodb";
import {
  buildBlogsSeed,
  buildSiteCollectionSeeds,
  buildSiteSeed,
  SITE_META_ID,
} from "./site-seed.server";

const inputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

export type ContactInput = z.infer<typeof inputSchema>;
export type ContactSubmission = ContactInput & {
  _id: string;
  createdAt: string;
  userAgent: string | null;
};

type SiteContent = Omit<ReturnType<typeof buildSiteSeed>, "_id" | "updatedAt"> & {
  updatedAt?: string | Date;
};

type RawDoc = Record<string, unknown> & { _id: string };

type ContactSubmissionRecord = {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  userAgent: string | null;
  _id?: import("mongodb").ObjectId;
};

function collection<T extends import("mongodb").Document>(db: Db, name: string) {
  return db.collection<T>(name);
}

const MONGO_FALLBACK_LOG_INTERVAL_MS = 60_000;
const mongoFallbackLogTimes = new Map<string, number>();

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(
  /\/$/,
  "",
);

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function describeError(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

function warnMongoFallbackOnce(scope: string, error: unknown) {
  const now = Date.now();
  const lastLoggedAt = mongoFallbackLogTimes.get(scope) ?? 0;
  if (now - lastLoggedAt < MONGO_FALLBACK_LOG_INTERVAL_MS) return;

  mongoFallbackLogTimes.set(scope, now);
  console.warn(`${scope} Falling back to static data. ${describeError(error)}`);
}

const SECTION_COLLECTIONS = [
  "profile",
  "services",
  "serviceDetails",
  "education",
  "skills",
  "experience",
  "projects",
  "accomplishments",
  "blogUnits",
] as const;

const LEGACY_COLLECTION_IDS = new Set<string>([
  "site",
  "profile",
  ...SECTION_COLLECTIONS,
  SITE_META_ID,
]);

function toJSON<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function stripId(doc: RawDoc | null | undefined): Record<string, unknown> | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}

function assembleSiteContentFromDocs(docs: RawDoc[]): SiteContent {
  const fallback = buildSiteSeed() as Record<string, unknown>;
  const byId = new Map(docs.map((doc) => [String(doc._id), doc] as const));
  const legacyDoc = stripId(byId.get("site"));

  if (legacyDoc) {
    return toJSON({
      profile: legacyDoc.profile ?? fallback.profile,
      services: legacyDoc.services ?? fallback.services,
      serviceDetails: legacyDoc.serviceDetails ?? fallback.serviceDetails,
      education: legacyDoc.education ?? fallback.education,
      skills: legacyDoc.skills ?? fallback.skills,
      experience: legacyDoc.experience ?? fallback.experience,
      projects: legacyDoc.projects ?? fallback.projects,
      accomplishments: legacyDoc.accomplishments ?? fallback.accomplishments,
      blogUnits: legacyDoc.blogUnits ?? fallback.blogUnits,
      updatedAt: String(legacyDoc.updatedAt ?? fallback.updatedAt ?? new Date().toISOString()),
    }) as SiteContent;
  }

  const servicesDoc = byId.get("services");
  const serviceDetailsDoc = byId.get("serviceDetails");
  const educationDoc = byId.get("education");
  const skillsDoc = byId.get("skills");
  const experienceDoc = byId.get("experience");
  const projectsDoc = byId.get("projects");
  const accomplishmentsDoc = byId.get("accomplishments");
  const blogUnitsDoc = byId.get("blogUnits");
  const metaDoc = byId.get(SITE_META_ID);

  return toJSON({
    profile: stripId(byId.get("profile")) ?? (fallback.profile as Record<string, unknown>),
    services: (servicesDoc?.items as unknown[] | undefined) ?? (fallback.services as unknown[]),
    serviceDetails:
      (stripId(serviceDetailsDoc) as Record<string, unknown> | null) ??
      (fallback.serviceDetails as Record<string, unknown>),
    education: (educationDoc?.items as unknown[] | undefined) ?? (fallback.education as unknown[]),
    skills: (skillsDoc?.items as unknown[] | undefined) ?? (fallback.skills as unknown[]),
    experience:
      (experienceDoc?.items as unknown[] | undefined) ?? (fallback.experience as unknown[]),
    projects: (projectsDoc?.items as unknown[] | undefined) ?? (fallback.projects as unknown[]),
    accomplishments:
      (accomplishmentsDoc?.items as unknown[] | undefined) ??
      (fallback.accomplishments as unknown[]),
    blogUnits: (blogUnitsDoc?.items as unknown[] | undefined) ?? (fallback.blogUnits as unknown[]),
    updatedAt: String(metaDoc?.updatedAt ?? fallback.updatedAt ?? new Date().toISOString()),
  }) as SiteContent;
}

async function seedSiteCollections(db: Db, content: SiteContent) {
  const metaDoc = {
    _id: SITE_META_ID,
    updatedAt: new Date(content.updatedAt ?? new Date()).toISOString(),
  };

  const seeds = buildSiteCollectionSeeds({
    ...buildSiteSeed(),
    ...content,
    updatedAt: new Date(metaDoc.updatedAt),
  });

  for (const seed of seeds) {
    await collection<RawDoc>(db, seed.collection).replaceOne({ _id: seed.doc._id }, seed.doc, {
      upsert: true,
    });
  }
}

async function readSiteCollections(db: Db): Promise<SiteContent | null> {
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
  ] = await Promise.all([
    collection<RawDoc>(db, "site_content").findOne({ _id: SITE_META_ID }),
    collection<RawDoc>(db, "profile").findOne({ _id: "profile" }),
    collection<RawDoc>(db, "services").findOne({ _id: "services" }),
    collection<RawDoc>(db, "serviceDetails").findOne({ _id: "serviceDetails" }),
    collection<RawDoc>(db, "education").findOne({ _id: "education" }),
    collection<RawDoc>(db, "skills").findOne({ _id: "skills" }),
    collection<RawDoc>(db, "experience").findOne({ _id: "experience" }),
    collection<RawDoc>(db, "projects").findOne({ _id: "projects" }),
    collection<RawDoc>(db, "accomplishments").findOne({ _id: "accomplishments" }),
    collection<RawDoc>(db, "blogUnits").findOne({ _id: "blogUnits" }),
  ]);

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

  return assembleSiteContentFromDocs([
    metaDoc as RawDoc,
    profileDoc as RawDoc,
    servicesDoc as RawDoc,
    serviceDetailsDoc as RawDoc,
    educationDoc as RawDoc,
    skillsDoc as RawDoc,
    experienceDoc as RawDoc,
    projectsDoc as RawDoc,
    accomplishmentsDoc as RawDoc,
    blogUnitsDoc as RawDoc,
  ]);
}

async function migrateLegacySiteCollections(db: Db): Promise<SiteContent | null> {
  const legacyDocs = (await collection<RawDoc>(db, "site_content").find({}).toArray()) as RawDoc[];
  const hasLegacy = legacyDocs.some((doc) => LEGACY_COLLECTION_IDS.has(String(doc._id)));

  if (!hasLegacy) {
    return null;
  }

  const content = assembleSiteContentFromDocs(legacyDocs);
  await seedSiteCollections(db, content);
  await collection<RawDoc>(db, "site_content").deleteMany({ _id: { $ne: SITE_META_ID } });
  return content;
}

type ContactSubmissionResponse = {
  ok?: boolean;
  id?: string;
  error?: string;
};

export async function submitContact(data: ContactInput) {
  const response = await fetch(apiUrl("/api/contact"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const payload = (await response.json().catch(() => ({}))) as ContactSubmissionResponse;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? "Failed to save your message. Please try again later.");
  }

  return { ok: true, id: payload.id ?? "" };
}

type ContactSubmissionsResponse = {
  ok?: boolean;
  submissions?: ContactSubmission[];
  error?: string;
};

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  const response = await fetch(apiUrl("/api/admin/contact-submissions"), {
    credentials: "include",
  });

  const payload = (await response.json().catch(() => ({}))) as ContactSubmissionsResponse;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? "Failed to load contact submissions.");
  }

  return toJSON(payload.submissions ?? []);
}
export const getSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContent> => {
    try {
      const response = await fetch(apiUrl("/api/site"));
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        site?: SiteContent;
        error?: string;
      };

      if (response.ok && data.site) {
        return toJSON(data.site);
      }

      console.warn(data.error ?? "Backend site content unavailable. Falling back to static data.");
      const raw = buildSiteSeed() as Record<string, unknown>;
      delete raw._id;
      return toJSON(raw) as SiteContent;
    } catch (error) {
      warnMongoFallbackOnce("Failed to fetch site content from backend.", error);
      const raw = buildSiteSeed() as Record<string, unknown>;
      delete raw._id;
      return toJSON(raw) as SiteContent;
    }
  },
);

export const getBlogs = createServerFn({ method: "GET" }).handler(async (): Promise<Blog[]> => {
  try {
    const response = await fetch(apiUrl("/api/blogs"));
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      blogs?: Blog[];
      error?: string;
    };

    if (response.ok && data.blogs) {
      return toJSON(data.blogs);
    }

    console.warn(data.error ?? "Backend blogs unavailable. Falling back to static data.");
    const { blogs: staticBlogs } = await import("@/data/site");
    return toJSON(staticBlogs);
  } catch (error) {
    warnMongoFallbackOnce("Failed to fetch blogs from backend.", error);
    const { blogs: staticBlogs } = await import("@/data/site");
    return toJSON(staticBlogs);
  }
});

export const getBlogBySlug = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }): Promise<Blog | null> => {
    try {
      const response = await fetch(apiUrl(`/api/blogs/${encodeURIComponent(data.slug)}`));
      if (response.status === 404) return null;

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        blog?: Blog;
        error?: string;
      };

      if (response.ok && body.blog) {
        return toJSON(body.blog);
      }

      console.warn(body.error ?? "Backend blog unavailable. Falling back to static data.");
      const { blogs: staticBlogs } = await import("@/data/site");
      return toJSON(staticBlogs.find((b) => b.slug === data.slug) ?? null);
    } catch (error) {
      warnMongoFallbackOnce("Failed to fetch blog by slug from backend.", error);
      const { blogs: staticBlogs } = await import("@/data/site");
      return toJSON(staticBlogs.find((b) => b.slug === data.slug) ?? null);
    }
  });
