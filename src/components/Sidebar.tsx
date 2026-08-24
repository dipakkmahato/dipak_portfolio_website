import { Link, useRouterState } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import profileImg from "@/assets/profile.jpg";
import { profile as fallbackProfile } from "@/data/site";
import { ChevronUp, ChevronDown, Menu, X, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { getCVInfoFn, getCVDownloadFn, type CVInfo } from "@/lib/cv.functions";
import { getSiteContent } from "@/lib/site.functions";

const NAV = [
  { id: "home", label: "HOME" },
  { id: "about", label: "ABOUT" },
  { id: "education", label: "EDUCATION" },
  { id: "skills", label: "SKILLS" },
  { id: "experience", label: "EXPERIENCE" },
  { id: "work", label: "WORK" },
  { id: "accomplishment", label: "ACCOMPLISHMENT" },
  { id: "blog", label: "BLOG" },
  { id: "contact", label: "CONTACT" },
];

const siteQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
});

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onHome = pathname === "/";
  const { data: site } = useQuery(siteQuery);
  const profile = site?.profile ?? fallbackProfile;
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);
  const [cvInfo, setCvInfo] = useState<CVInfo | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getCVInfoFn()
      .then((info: CVInfo) => setCvInfo(info))
      .catch(() => {
        // CV metadata unavailable; the download button will still call the backend
        setCvInfo({
          filename: "Dipak_Kumar_Singh_CV.pdf",
          originalName: "Dipak_Kumar_Singh_CV.pdf",
          mimeType: "application/pdf",
          size: 0,
          updatedAt: new Date().toISOString(),
        });
      });
  }, []);

  useEffect(() => {
    if (!onHome) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [onHome]);

  const scrollBy = (dy: number) => window.scrollBy({ top: dy, behavior: "smooth" });

  const handleDownloadCV = async () => {
    if (downloading) return;
    setDownloading(true);

    toast.info("Preparing download...", {
      icon: <Download className="h-4 w-4 text-amber-400" />,
    });

    try {
      const cvData = await getCVDownloadFn();
      const url = URL.createObjectURL(cvData.blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = cvData.originalName || cvInfo?.originalName || "CV.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Curriculum Vitae downloaded!", {
        icon: <Download className="h-4 w-4 text-amber-400" />,
      });
    } catch {
      toast.error("Download failed. Please try again.", {
        icon: <FileText className="h-4 w-4 text-amber-400" />,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-[var(--sidebar-bg)] px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <img src={profileImg} alt={profile.name} className="h-9 w-9 rounded-full object-cover" />
          <span className="font-display font-bold">{profile.name}</span>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Menu" className="p-2">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside
        className={`${open ? "block" : "hidden"} lg:block fixed lg:sticky top-0 left-0 z-30 h-screen w-full lg:w-[280px] shrink-0 bg-[var(--sidebar-bg)] border-r flex flex-col`}
      >
        <button
          onClick={() => scrollBy(-window.innerHeight * 0.7)}
          className="hidden lg:flex items-center justify-center py-2 text-muted-foreground hover:text-foreground"
          aria-label="Scroll up"
        >
          <ChevronUp size={16} />
        </button>

        <div className="flex-1 overflow-y-auto px-6 py-6 lg:py-10 flex flex-col items-center text-center">
          <div className="h-32 w-32 lg:h-40 lg:w-40 rounded-full overflow-hidden ring-1 ring-border bg-white">
            <img
              src={profileImg}
              alt={profile.name}
              className="h-full w-full object-cover"
              width={512}
              height={512}
            />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold">{profile.name}</h2>
          <p className="mt-1 text-xs tracking-[0.25em]">
            <span className="text-[var(--link)] font-semibold">{profile.role.toUpperCase()}</span>{" "}
            <span className="text-muted-foreground">IN {profile.location.toUpperCase()}</span>
          </p>

          <nav className="mt-8 w-full">
            <ul className="flex flex-col items-center gap-3">
              {NAV.map((n) => {
                const href = onHome ? `#${n.id}` : `/#${n.id}`;
                const isActive = onHome && active === n.id;
                return (
                  <li key={n.id} className="w-full">
                    {onHome ? (
                      <a
                        href={href}
                        onClick={() => setOpen(false)}
                        className={`block text-xs tracking-[0.25em] py-1 transition-colors ${
                          isActive
                            ? "text-[var(--link)] font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {n.label}
                      </a>
                    ) : (
                      <Link
                        to="/"
                        hash={n.id}
                        onClick={() => setOpen(false)}
                        className="block text-xs tracking-[0.25em] py-1 text-muted-foreground hover:text-foreground"
                      >
                        {n.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* CURRICULUM VITAE DOWNLOAD BOX */}
            <div className="mt-6 w-full pt-4 border-t border-border/40">
              <button
                onClick={handleDownloadCV}
                disabled={downloading}
                className="w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-amber-900/20 border border-amber-500/40 py-2.5 px-3 flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-[1.03] hover:border-amber-400 hover:from-amber-500/25 hover:via-yellow-500/20 hover:shadow-[0_0_20px_rgba(251,191,36,0.35)] cv-box-pulse active:scale-[0.98] cursor-pointer group disabled:opacity-70 disabled:cursor-wait disabled:scale-100"
                title="Click to Download Curriculum Vitae"
              >
                {/* Glowing background sheen */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                {/* FLOATING TEXT INSIDE COMPACT BOX */}
                <div className="animate-float flex items-center justify-center gap-2">
                  <FileText size={16} className="text-amber-400 shrink-0" />
                  <span className="font-display font-bold text-xs tracking-wide bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]">
                    Curriculum Vitae
                  </span>
                </div>

                {/* Download Action Subtext */}
                <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300/80 group-hover:text-amber-200 transition-colors">
                  <Download
                    size={11}
                    className={
                      downloading
                        ? "animate-bounce"
                        : "group-hover:translate-y-0.5 transition-transform"
                    }
                  />
                  <span className="tracking-wider uppercase text-[9px]">
                    {downloading ? "Downloading..." : "Click to Download"}
                  </span>
                </div>
              </button>
            </div>
          </nav>
        </div>

        <button
          onClick={() => scrollBy(window.innerHeight * 0.7)}
          className="hidden lg:flex items-center justify-center py-2 text-muted-foreground hover:text-foreground"
          aria-label="Scroll down"
        >
          <ChevronDown size={16} />
        </button>
      </aside>
    </>
  );
}
