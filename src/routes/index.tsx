import { createFileRoute } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import HomePage from "@/components/HomePage";
import { getBlogs, getSiteContent } from "@/lib/site.functions";

const siteQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
});

const blogsQuery = queryOptions({
  queryKey: ["blogs"],
  queryFn: () => getBlogs(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dipak Kumar Singh — Developer in Nepal" },
      {
        name: "description",
        content:
          "Full-stack developer, lecturer, and IoT enthusiast. Web & mobile development, data analysis, and machine learning.",
      },
      { property: "og:title", content: "Dipak Kumar Singh — Developer in Nepal" },
      {
        property: "og:description",
        content: "Portfolio, projects, and writings of Dipak Kumar Singh.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(blogsQuery),
    ]);
  },
  component: HomePage,
});
