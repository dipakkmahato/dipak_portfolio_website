import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { type BlogBlock, type Blog } from "@/data/site";
import { Section } from "@/components/Section";
import { ExternalLink } from "lucide-react";
import { getBlogBySlug, getSiteContent } from "@/lib/site.functions";

const blogQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog", slug],
    queryFn: () => getBlogBySlug({ data: { slug } }),
  });

const siteQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
});

export const Route = createFileRoute("/blogs/$slug")({
  head: ({ loaderData }: { loaderData?: { blog: Blog } }) => {
    const b = loaderData?.blog;
    return {
      meta: [
        { title: `${b?.title ?? "Blog"} — Dipak Kumar Singh` },
        { name: "description", content: b?.excerpt ?? "Blog post by Dipak Kumar Singh." },
        { property: "og:title", content: `${b?.title ?? "Blog"} — Dipak Kumar Singh` },
        { property: "og:description", content: b?.excerpt ?? "" },
        ...(b?.cover ? [{ property: "og:image", content: b.cover }] : []),
      ],
    };
  },
  loader: async ({ params, context }) => {
    const [blog] = await Promise.all([
      context.queryClient.ensureQueryData(blogQuery(params.slug)),
      context.queryClient.ensureQueryData(siteQuery),
    ]);
    if (!blog) throw notFound();
    return { blog };
  },
  errorComponent: ({ error }) => (
    <Section id="err" eyebrow="Error" title="Something went wrong">
      <p className="text-red-600">{error.message}</p>
      <Link to="/blogs" className="text-[var(--link)]">
        ← Back to all blogs
      </Link>
    </Section>
  ),
  notFoundComponent: () => (
    <Section id="404" eyebrow="404" title="Blog not found">
      <Link to="/blogs" className="text-[var(--link)]">
        ← Back to all blogs
      </Link>
    </Section>
  ),
  component: BlogDetail,
});

function renderBlock(b: BlogBlock, i: number) {
  switch (b.type) {
    case "h2":
      return (
        <h2 key={i} className="font-display text-2xl font-bold mt-8 mb-3">
          {b.text}
        </h2>
      );
    case "h3":
      return (
        <h3 key={i} className="font-display text-xl font-semibold mt-6 mb-2">
          {b.text}
        </h3>
      );
    case "p":
      return (
        <p key={i} className="leading-relaxed text-foreground/85 my-3">
          {b.text}
        </p>
      );
    case "hr":
      return <hr key={i} className="my-8" />;
    case "ul":
      return (
        <ul key={i} className="list-disc pl-6 space-y-2 my-3">
          {b.items.map((it, j) =>
            typeof it === "string" ? (
              <li key={j}>{it}</li>
            ) : (
              <li key={j}>
                <span className="font-semibold">{it.text}</span>
                {it.children && (
                  <ul className="list-[circle] pl-6 mt-2 space-y-1 font-normal">
                    {it.children.map((c, k) => (
                      <li key={k}>{c}</li>
                    ))}
                  </ul>
                )}
              </li>
            ),
          )}
        </ul>
      );
  }
}

const UNIT_IMAGES: Record<string, string> = {
  "Unit 1: Introduction": "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=70",
  "Unit 2: JavaScript": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&q=70",
  "Unit 2: React.js": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=70",
  "Unit 3: Django": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=70",
  "Unit 4: Web APIs": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=70",
  "Unit 5: Security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=70",
  "Unit 6: Deployment": "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&q=70",
};

const getUnitImage = (unit: string) => {
  return (
    UNIT_IMAGES[unit] || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=70"
  );
};

function BlogDetail() {
  const { slug } = Route.useParams();
  const { data: blog } = useSuspenseQuery(blogQuery(slug));
  const { data: site } = useSuspenseQuery(siteQuery);
  const { blogUnits } = site;
  if (!blog) return null;

  if (blog.slug === "web-application-programming") {
    return (
      <Section id="series" eyebrow="My Blog" title="Web Application Programming">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogUnits.map((u) => (
            <div key={u.unit} className="bg-white rounded-md border p-5">
              <h3 className="font-display text-lg font-bold text-slate-900">{u.unit}</h3>
              <div className="mt-4 aspect-[4/3] rounded relative overflow-hidden group flex items-center justify-center p-4 text-center">
                <img
                  src={getUnitImage(u.unit)}
                  alt={u.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/60 transition-colors duration-300 group-hover:bg-slate-950/50" />
                <span className="font-display font-bold text-white text-sm sm:text-base relative z-10 drop-shadow-md px-2">
                  {u.title}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {u.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                    {t}
                  </span>
                ))}
                <Link
                  to="/blogs"
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                >
                  <ExternalLink size={14} />
                  Open Blog
                </Link>
              </div>
            </div>
          ))}
        </div>
        <Link to="/blogs" className="inline-block mt-8 text-[var(--link)]">
          ← Back to all blogs
        </Link>
      </Section>
    );
  }

  return (
    <Section id="post" eyebrow={blog.category} title={blog.title}>
      <article className="max-w-3xl">
        {blog.cover && (
          <img
            src={blog.cover}
            alt={blog.title}
            className="w-full aspect-[16/8] object-cover rounded mb-8"
          />
        )}
        {blog.excerpt && <p className="text-lg text-muted-foreground italic">{blog.excerpt}</p>}
        {blog.link && (
          <a
            href={blog.link}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 mt-5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <ExternalLink size={16} />
            Open Link
          </a>
        )}
        {blog.body?.map(renderBlock)}
        <Link to="/blogs" className="inline-block mt-10 text-[var(--link)]">
          ← Back to all blogs
        </Link>
      </article>
    </Section>
  );
}

