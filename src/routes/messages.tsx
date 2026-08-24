import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/Section";
import { getContactSubmissions, type ContactSubmission } from "@/lib/site.functions";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");

type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type MongoHealth = {
  ok?: boolean;
  connected?: boolean;
  state?: string;
  readyState?: number;
  message?: string;
  error?: string;
  database?: string;
  host?: string;
};

type AdminSiteResponse = { ok?: boolean; site?: unknown; error?: string };
type AdminBlogsResponse = { ok?: boolean; blogs?: unknown[]; error?: string };

type BlogRow = { slug: string; title: string; category?: string; link?: string | null };

function pretty(v: unknown) {
  return JSON.stringify(v ?? null, null, 2);
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages - Dipak Kumar Singh" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [siteMessage, setSiteMessage] = useState<string | null>(null);
  const [blogMessage, setBlogMessage] = useState<string | null>(null);
  const [loadingSite, setLoadingSite] = useState(false);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [loadingMongoHealth, setLoadingMongoHealth] = useState(false);
  const [mongoHealth, setMongoHealth] = useState<MongoHealth | null>(null);
  const [savingSite, setSavingSite] = useState(false);
  const [savingBlogs, setSavingBlogs] = useState(false);
  const [siteText, setSiteText] = useState("{}");
  const [blogsText, setBlogsText] = useState("[]");

  const loadMongoHealth = async () => {
    setLoadingMongoHealth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/mongo`);
      const data = (await response.json().catch(() => ({}))) as MongoHealth;
      setMongoHealth({
        ok: response.ok && data.ok,
        connected: Boolean(data.connected),
        state: data.state ?? (response.ok ? "connected" : "disconnected"),
        readyState: data.readyState,
        message: data.message,
        error: data.error,
        database: data.database,
        host: data.host,
      });
    } catch {
      setMongoHealth({ ok: false, connected: false, state: "unreachable", message: "Health check failed" });
    } finally {
      setLoadingMongoHealth(false);
    }
  };
  const loadSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const data = await getContactSubmissions();
      setSubmissions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load contact submissions";
      setError(message);
      if (/unauthorized/i.test(message)) setAuthStatus("unauthenticated");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadSiteEditor = async () => {
    setLoadingSite(true);
    setSiteError(null);
    setSiteMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/site`, { credentials: "include" });
      const data = (await response.json().catch(() => ({}))) as AdminSiteResponse;
      if (response.status === 401) {
        setAuthStatus("unauthenticated");
        return;
      }
      if (!response.ok || !data.ok || !data.site) throw new Error(data.error ?? "Failed to load site content");
      const site = data.site as Record<string, unknown>;
      setSiteText(
        pretty({
          profile: site.profile ?? {},
          services: site.services ?? [],
          projects: site.projects ?? [],
        }),
      );
    } catch (err) {
      setSiteError(err instanceof Error ? err.message : "Failed to load site content");
    } finally {
      setLoadingSite(false);
    }
  };

  const loadBlogEditor = async () => {
    setLoadingBlogs(true);
    setBlogError(null);
    setBlogMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blogs`, { credentials: "include" });
      const data = (await response.json().catch(() => ({}))) as AdminBlogsResponse;
      if (response.status === 401) {
        setAuthStatus("unauthenticated");
        return;
      }
      if (!response.ok || !data.ok || !data.blogs) throw new Error(data.error ?? "Failed to load blogs");
      setBlogsText(
        pretty(
          (data.blogs as BlogRow[]).map((blog) => ({
            slug: blog.slug,
            title: blog.title,
            category: blog.category ?? "",
            link: blog.link ?? "",
          })),
        ),
      );
    } catch (err) {
      setBlogError(err instanceof Error ? err.message : "Failed to load blogs");
    } finally {
      setLoadingBlogs(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/status`, { credentials: "include" });
        const data = (await response.json().catch(() => ({}))) as { authenticated?: boolean; user?: string };
        if (response.ok && data.authenticated) {
          setUser(data.user ?? null);
          setAuthStatus("authenticated");
          await Promise.all([loadSubmissions(), loadSiteEditor(), loadBlogEditor(), loadMongoHealth()]);
        } else {
          setAuthStatus("unauthenticated");
        }
      } catch {
        setAuthStatus("unauthenticated");
      }
    };
    void checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSiteError(null);
    setBlogError(null);
    setSiteMessage(null);
    setBlogMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; user?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Login failed");
      setUser(data.user ?? loginForm.username);
      setAuthStatus("authenticated");
      setLoginForm({ username: "", password: "" });
      setMongoHealth(null);
      await Promise.all([loadSubmissions(), loadSiteEditor(), loadBlogEditor(), loadMongoHealth()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setAuthStatus("unauthenticated");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
      setSubmissions([]);
      setMongoHealth(null);
      setSiteText("{}");
      setBlogsText("[]");
      setAuthStatus("unauthenticated");
    }
  };

  const handleSaveSite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingSite(true);
    setError(null);
    setSiteError(null);
    setSiteMessage(null);
    const draft = parseJson<Record<string, unknown>>(siteText, {});
    const profile = parseJson<Record<string, unknown>>(pretty(draft.profile ?? {}), {});
    const services = parseJson<unknown[]>(pretty(draft.services ?? []), []);
    const projects = parseJson<unknown[]>(pretty(draft.projects ?? []), []);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/site`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, services, projects }),
      });
      const data = (await response.json().catch(() => ({}))) as AdminSiteResponse;
      if (response.status === 401) {
        setAuthStatus("unauthenticated");
        throw new Error("Unauthorized");
      }
      if (!response.ok || !data.ok || !data.site) throw new Error(data.error ?? "Failed to save site content");
      setSiteMessage("Site content saved to MongoDB.");
      await loadSiteEditor();
    } catch (err) {
      setSiteError(err instanceof Error ? err.message : "Failed to save site content");
    } finally {
      setSavingSite(false);
    }
  };

  const handleSaveBlogs = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingBlogs(true);
    setError(null);
    setBlogError(null);
    setBlogMessage(null);
    const blogs = parseJson<BlogRow[]>(blogsText, []);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blogs`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogs: blogs.map((blog) => ({ slug: blog.slug, link: blog.link })) }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (response.status === 401) {
        setAuthStatus("unauthenticated");
        throw new Error("Unauthorized");
      }
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Failed to save blog links");
      setBlogMessage("Blog links saved to MongoDB.");
      await loadBlogEditor();
    } catch (err) {
      setBlogError(err instanceof Error ? err.message : "Failed to save blog links");
    } finally {
      setSavingBlogs(false);
    }
  };

  return (
    <Section id="messages" eyebrow="Backend" title="Contact Submissions">
      {authStatus !== "authenticated" ? (
        <form onSubmit={handleLogin} className="max-w-md space-y-4 rounded-xl border border-border/60 bg-card p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Username</label>
            <input value={loginForm.username} onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))} autoComplete="username" className="w-full rounded-md border border-border/60 bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <input value={loginForm.password} onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))} type="password" autoComplete="current-password" className="w-full rounded-md border border-border/60 bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="rounded-md bg-[var(--link)] px-4 py-3 text-sm font-semibold text-white">Sign in</button>
        </form>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">Signed in as {user}</p>
              <span
                title={mongoHealth?.message ?? "MongoDB health"}
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  loadingMongoHealth
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                    : mongoHealth?.connected
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                      : "border-red-500/30 bg-red-500/10 text-red-700",
                ].join(" ")}
              >
                {loadingMongoHealth ? "Mongo Checking" : mongoHealth?.connected ? "Mongo Online" : "Mongo Offline"}
              </span>
            </div>
            <button type="button" onClick={handleLogout} className="rounded-md border border-border/60 px-4 py-2 text-sm">Sign out</button>
          </div>

          <section className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Site Editor</h2>
                <p className="text-sm text-muted-foreground">Edit profile text, service cards, and project URLs as JSON.</p>
              </div>
              {siteMessage && <p className="text-sm text-emerald-600">{siteMessage}</p>}
            </div>
            {loadingSite ? (
              <p className="mt-6 text-muted-foreground">Loading site content...</p>
            ) : (
              <form onSubmit={handleSaveSite} className="mt-6 space-y-4">
                <textarea value={siteText} onChange={(e) => setSiteText(e.target.value)} rows={20} className="w-full rounded-md border border-border/60 bg-background px-4 py-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary" />
                <p className="text-xs text-muted-foreground">Expected keys: `profile`, `services`, `projects`. Keep JSON valid before saving.</p>
                {siteError && <p className="text-sm text-red-600">{siteError}</p>}
                <button type="submit" disabled={savingSite} className="rounded-md bg-[var(--link)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70">{savingSite ? "Saving..." : "Save Site Content"}</button>
              </form>
            )}
          </section>

          <section className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Blog Link Editor</h2>
                <p className="text-sm text-muted-foreground">Update blog links directly in MongoDB as JSON.</p>
              </div>
              {blogMessage && <p className="text-sm text-emerald-600">{blogMessage}</p>}
            </div>
            {loadingBlogs ? (
              <p className="mt-6 text-muted-foreground">Loading blog entries...</p>
            ) : (
              <form onSubmit={handleSaveBlogs} className="mt-6 space-y-4">
                <textarea value={blogsText} onChange={(e) => setBlogsText(e.target.value)} rows={18} className="w-full rounded-md border border-border/60 bg-background px-4 py-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary" />
                <p className="text-xs text-muted-foreground">Each blog item should include `slug` and `link`. Empty link removes the external URL.</p>
                {blogError && <p className="text-sm text-red-600">{blogError}</p>}
                <button type="submit" disabled={savingBlogs} className="rounded-md bg-[var(--link)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70">{savingBlogs ? "Saving..." : "Save Blog Links"}</button>
              </form>
            )}
          </section>

          <div className="space-y-4">
            {loadingSubmissions ? (
              <p className="text-muted-foreground">Loading contact submissions...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : submissions.length === 0 ? (
              <p className="text-muted-foreground">No contact submissions yet.</p>
            ) : (
              <div className="grid gap-4">
                {submissions.map((msg) => (
                  <article key={msg._id} className="rounded-xl border border-border/60 bg-card p-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-display text-xl font-bold">{msg.subject}</h3>
                      <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Name:</span> {msg.name}</p>
                      <p><span className="font-semibold text-foreground">Email:</span> {msg.email}</p>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap leading-relaxed text-foreground/85">{msg.message}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
