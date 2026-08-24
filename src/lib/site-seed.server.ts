import {
  profile,
  services,
  webDesignDetails,
  webDevDetails,
  dataAnalysisDetails,
  mobileAppDetails,
  education,
  skills,
  experience,
  projects,
  accomplishments,
  blogs,
  blogUnits,
} from "@/data/site";

export const SITE_DOC_ID = "site";
export const SITE_META_ID = "site_content";

export function buildSiteSeed() {
  return {
    _id: SITE_DOC_ID,
    profile,
    services,
    serviceDetails: {
      webDesign: webDesignDetails,
      webDev: webDevDetails,
      dataAnalysis: dataAnalysisDetails,
      mobileApp: mobileAppDetails,
    },
    education,
    skills,
    experience,
    projects,
    accomplishments,
    blogUnits,
    updatedAt: new Date(),
  };
}

export function buildSiteCollectionSeeds(content = buildSiteSeed()) {
  const updatedAt = new Date(content.updatedAt ?? new Date());

  return [
    { collection: "site_content", doc: { _id: SITE_META_ID, updatedAt } },
    { collection: "profile", doc: { _id: "profile", ...(content.profile as object) } },
    { collection: "services", doc: { _id: "services", items: content.services } },
    {
      collection: "serviceDetails",
      doc: {
        _id: "serviceDetails",
        ...(content.serviceDetails as object),
      },
    },
    { collection: "education", doc: { _id: "education", items: content.education } },
    { collection: "skills", doc: { _id: "skills", items: content.skills } },
    { collection: "experience", doc: { _id: "experience", items: content.experience } },
    { collection: "projects", doc: { _id: "projects", items: content.projects } },
    {
      collection: "accomplishments",
      doc: { _id: "accomplishments", items: content.accomplishments },
    },
    { collection: "blogUnits", doc: { _id: "blogUnits", items: content.blogUnits } },
  ] as const;
}

export function buildBlogsSeed() {
  return blogs.map((b) => ({ ...b, _id: b.slug }));
}
