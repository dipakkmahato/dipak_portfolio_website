import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/Section";
import { getContactSubmissions, type ContactSubmission } from "@/lib/site.functions";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(
  /\/$/,
  "",
);

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [{ title: "Messages - Dipak Kumar Singh" }],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const loadSubmissions = async () => {
    setLoadingSubmissions(true);
    setError(null);
    try {
      const data = await getContactSubmissions();
      setSubmissions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load contact submissions";
      setError(message);
      if (/unauthorized/i.test(message)) {
        setAuthStatus("unauthenticated");
      }
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
          credentials: "include",
        });
        const data = (await response.json().catch(() => ({}))) as {
          authenticated?: boolean;
          user?: string;
        };

        if (response.ok && data.authenticated) {
          setUser(data.user ?? null);
          setAuthStatus("authenticated");
          await loadSubmissions();
        } else {
          setAuthStatus("unauthenticated");
        }
      } catch {
        setAuthStatus("unauthenticated");
      }
    };

    void checkAuth();
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        user?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Login failed");
      }

      setUser(data.user ?? loginForm.username);
      setAuthStatus("authenticated");
      setLoginForm({ username: "", password: "" });
      await loadSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setAuthStatus("unauthenticated");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setSubmissions([]);
      setAuthStatus("unauthenticated");
    }
  };

  return (
    <Section id="messages" eyebrow="Backend" title="Contact Submissions">
      {authStatus !== "authenticated" ? (
        <form
          onSubmit={handleLogin}
          className="max-w-md space-y-4 rounded-xl border border-border/60 bg-card p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Username</label>
            <input
              value={loginForm.username}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
              autoComplete="username"
              className="w-full rounded-md border border-border/60 bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <input
              value={loginForm.password}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-border/60 bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="rounded-md bg-[var(--link)] px-4 py-3 text-sm font-semibold text-white"
          >
            Sign in
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Signed in as {user}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-border/60 px-4 py-2 text-sm"
            >
              Sign out
            </button>
          </div>
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
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Name:</span> {msg.name}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Email:</span> {msg.email}
                    </p>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap leading-relaxed text-foreground/85">
                    {msg.message}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
