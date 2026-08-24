import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Section } from "@/components/Section";
import type { Blog } from "@/data/site";
import { getBlogs } from "@/lib/site.functions";

const blogsQuery = queryOptions({
  queryKey: ["blogs"],
  queryFn: () => getBlogs(),
});

function BlogCard({ blog }: { blog: Blog }) {
  const content = (
    <>
      <div className="aspect-[4/3] rounded overflow-hidden relative flex items-center justify-center p-4 text-center">
        <img
          src={blog.cover || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=70"}
          alt={blog.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-slate-950/65 transition-colors duration-300 group-hover:bg-slate-950/55" />
        <h3 className="font-display text-xl font-bold text-white relative z-10 drop-shadow-md px-2 leading-tight">
          {blog.title}
        </h3>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {blog.tags.map((t) => (
          <span key={t} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
            {t}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <ExternalLink size={14} />
          Open Blog
        </span>
      </div>
    </>
  );

  return blog.link ? (
    <a
      href={blog.link}
      target="_blank"
      rel="noreferrer noopener"
      className="bg-white text-slate-900 rounded-md border p-5 hover:shadow-md transition-shadow block group"
    >
      {content}
    </a>
  ) : (
    <Link
      to="/blogs/$slug"
      params={{ slug: blog.slug }}
      className="bg-white text-slate-900 rounded-md border p-5 hover:shadow-md transition-shadow block group"
    >
      {content}
    </Link>
  );
}

export const Route = createFileRoute("/blogs/")({
  head: () => ({
    meta: [
      { title: "Blogs — Dipak Kumar Singh" },
      {
        name: "description",
        content: "Articles and series on web development, backend, architecture and DevOps.",
      },
      { property: "og:title", content: "Blogs — Dipak Kumar Singh" },
      { property: "og:description", content: "Articles and series by Dipak Kumar Singh." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(blogsQuery),
  errorComponent: ({ error }) => (
    <Section id="err" eyebrow="Error" title="Could not load blogs">
      <p className="text-red-600">{error.message}</p>
    </Section>
  ),
  pendingComponent: () => (
    <Section id="loading" eyebrow="My Blog" title="Recent Blog">
      <p className="text-muted-foreground">Loading…</p>
    </Section>
  ),
  component: BlogsIndex,
});

function BlogsIndex() {
  const { data: blogs } = useSuspenseQuery(blogsQuery);
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(blogs.map((b) => b.category)))],
    [blogs],
  );
  const [cat, setCat] = useState("All");
  const filtered = blogs.filter((b) => cat === "All" || b.category === cat);

  return (
    <Section id="blogs" eyebrow="My Blog" title="Recent Blog">
      <div className="flex flex-wrap items-center gap-3 mb-6 -mt-4">
        <span className="text-sm text-muted-foreground">▽ Filter Blogs:</span>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="text-sm border rounded px-3 py-1.5 bg-white text-slate-900"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} blogs found</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((b) => (
          <BlogCard blog={b} key={b.slug} />
        ))}
      </div>
    </Section>
  );
}
