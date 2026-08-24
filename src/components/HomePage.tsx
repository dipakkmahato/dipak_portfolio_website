import { Section } from "@/components/Section";
import type { Blog, Project } from "@/data/site";
import heroImg from "@/assets/hero.jpg";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Globe,
  Palette,
  Database,
  Smartphone,
  Mail,
  MapPin,
  Phone,
  ExternalLink,
  Linkedin,
  Github,
  Facebook,
  Youtube,
  Instagram,
  Twitter,
  Pencil,
  Globe2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { getBlogs, getSiteContent } from "@/lib/site.functions";

const siteQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
});

const blogsQuery = queryOptions({
  queryKey: ["blogs"],
  queryFn: () => getBlogs(),
});

function BlogCard({ blog }: { blog: Blog }) {
  const content = (
    <>
      <div className="aspect-[4/3] rounded-lg overflow-hidden relative flex items-center justify-center p-4 text-center">
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
        {blog.tags.slice(0, 4).map((t) => (
          <span
            key={t}
            className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30"
          >
            {t}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 group-hover:bg-primary group-hover:text-white transition-all">
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
      className="bg-card rounded-xl border border-border/60 p-5 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-all block group"
    >
      {content}
    </a>
  ) : (
    <Link
      to="/blogs/$slug"
      params={{ slug: blog.slug }}
      className="bg-card rounded-xl border border-border/60 p-5 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-all block group"
    >
      {content}
    </Link>
  );
}

const ICONS: Record<string, typeof Globe> = {
  globe: Globe,
  palette: Palette,
  database: Database,
  smartphone: Smartphone,
};

function ServiceCard({
  title,
  icon,
  color,
  isExpandable,
  isExpanded,
  onClick,
}: {
  title: string;
  icon: string;
  color: string;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
}) {
  const Icon = ICONS[icon] ?? Globe;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left bg-card rounded-xl p-6 shadow-sm hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-all border border-border/60 overflow-hidden w-full ${isExpandable ? "cursor-pointer" : "cursor-default"}`}
    >
      <Icon size={32} style={{ color }} />
      <p className="mt-6 font-semibold text-sm leading-snug">{title}</p>
      {isExpandable && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{isExpanded ? "Show less" : "Read more"}</span>
        </div>
      )}
      <span className="absolute left-0 bottom-0 h-[3px] w-full" style={{ background: color }} />
    </button>
  );
}

function TimelineItem({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="relative flex gap-4 pb-8">
      <div className="flex flex-col items-center">
        <div
          className="h-10 w-10 rounded-full grid place-items-center text-primary-foreground shrink-0 shadow-[var(--shadow-glow)]"
          style={{ background: color }}
        >
          <Pencil size={16} />
        </div>
        <span className="flex-1 w-px bg-border mt-2" />
      </div>
      <div className="flex-1 bg-card/70 backdrop-blur rounded-xl p-4 border border-border/60">
        {children}
      </div>
    </div>
  );
}

function SkillBar({ name, value, color }: { name: string; value: number; color: string }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{name}</span>
        <span style={{ color }} className="font-semibold">
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-5 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-all">
      <h3 className="font-display text-xl font-bold">{p.title}</h3>

      <p className="text-sm text-muted-foreground mt-1">{p.type}</p>

      <div className="mt-4 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        <img src={p.cover} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {p.tags.map((t) => (
          <span
            key={t}
            className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30"
          >
            {t}
          </span>
        ))}

        <a
          href={p.link ?? "#"}
          target={p.link ? "_blank" : undefined}
          rel={p.link ? "noopener noreferrer" : undefined}
          onClick={(e) => {
            if (!p.link) e.preventDefault();
          }}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-all"
        >
          <ExternalLink size={14} />
          Open Project
        </a>
      </div>
    </div>
  );
}
function WorkSection() {
  const { data: site } = useSuspenseQuery(siteQuery);
  const { projects } = site;
  const allTechs = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => p.tags))).sort(),
    [projects],
  );
  const allServices = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => p.services))).sort(),
    [projects],
  );
  const [tech, setTech] = useState("");
  const [svc, setSvc] = useState("");
  const filtered = projects.filter(
    (p) => (!tech || p.tags.includes(tech)) && (!svc || p.services.includes(svc)),
  );

  return (
    <Section id="work" eyebrow="My Work" title="Recent Work">
      <div className="flex flex-wrap items-center gap-3 mb-6 -mt-4">
        <span className="text-sm text-muted-foreground">▽ Filter Projects:</span>
        <select
          value={tech}
          onChange={(e) => setTech(e.target.value)}
          className="text-sm border border-border rounded-md px-3 py-1.5 bg-card text-foreground"
        >
          <option value="">All Technologies</option>
          {allTechs.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          value={svc}
          onChange={(e) => setSvc(e.target.value)}
          className="text-sm border border-border rounded-md px-3 py-1.5 bg-card text-foreground"
        >
          <option value="">All Services</option>
          {allServices.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} projects found
        </span>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <ProjectCard key={p.title} p={p} />
        ))}
      </div>
    </Section>
  );
}

function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const fd = new FormData(form);
        const payload = {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          subject: String(fd.get("subject") ?? ""),
          message: String(fd.get("message") ?? ""),
        };
        setSubmitting(true);
        try {
          const { submitContact } = await import("@/lib/site.functions");
          await submitContact(payload);
          toast.success("Message sent! I'll get back to you soon.");
          form.reset();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed to send message";
          toast.error(msg);
        } finally {
          setSubmitting(false);
        }
      }}
      className="space-y-4"
    >
      <input
        required
        name="name"
        placeholder="Name"
        className="w-full px-4 py-3 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground border border-border/60 focus:ring-2 focus:ring-primary outline-none"
      />
      <input
        required
        type="email"
        name="email"
        placeholder="Email"
        className=" w-full px-4 py-3 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground border border-border/60 focus:ring-2 focus:ring-primary outline-none"
      />
      <input
        required
        name="subject"
        placeholder="Subject"
        className="w-full px-4 py-3 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground border border-border/60 focus:ring-2 focus:ring-primary outline-none"
      />
      <textarea
        required
        name="message"
        placeholder="Message"
        rows={5}
        className="w-full px-4 py-3 rounded-md bg-secondary text-foreground placeholder:text-muted-foreground border border-border/60 focus:ring-2 focus:ring-primary outline-none resize-none"
      />
      <button
        type="submit"
        disabled={submitting}
        style={{ background: "var(--grad-amber)" }}
        className="text-primary-foreground px-6 py-3 rounded-md text-sm font-bold tracking-wider hover:opacity-90 shadow-[var(--shadow-glow)] disabled:opacity-60"
      >
        {submitting ? "SENDING…" : "SEND MESSAGE"}
      </button>
    </form>
  );
}

export default function HomePage() {
  const { data: site } = useSuspenseQuery(siteQuery);
  const { data: blogs } = useSuspenseQuery(blogsQuery);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const {
    profile,
    services,
    education,
    skills,
    experience,
    accomplishments,
    blogUnits,
    serviceDetails,
  } = site;
  const { webDev, webDesign, dataAnalysis, mobileApp } = serviceDetails;

  return (
    <>
      <Toaster richColors position="top-right" />

      {/* Hero */}
      <section id="home" className="w-full relative">
        <img
          src={heroImg}
          alt={profile.name}
          width={1600}
          height={900}
          className="w-full h-[65vh] lg:h-[85vh] object-cover object-[center_15%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
          <div className="max-w-4xl">
            <p className="text-white font-semibold text-sm tracking-wider uppercase mb-2">
              {profile.role}
            </p>
            <h1 className="font-display text-4xl lg:text-6xl font-bold text-white drop-shadow-lg">
              {profile.name}
            </h1>
            <p className="text-white/90 text-lg lg:text-xl mt-2 drop-shadow-md">
              {profile.location}
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <Section id="about" eyebrow="About Me" title="Who Am I?">
        <p className="leading-relaxed text-justify text-foreground/85 max-w-4xl">{profile.bio}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {services.map((s) => (
            <ServiceCard
              key={s.title}
              title={s.title}
              icon={s.icon}
              color={s.color}
              isExpandable={!!s.detailKey}
              isExpanded={expandedService === s.detailKey}
              onClick={() => {
                if (s.detailKey) {
                  setExpandedService(expandedService === s.detailKey ? null : s.detailKey);
                }
              }}
            />
          ))}
        </div>

        {/* Web Development Detail */}
        {expandedService === "webDev" && (
          <div className="mt-6 bg-card/80 backdrop-blur rounded-2xl border border-border/60 p-8 lg:p-10 shadow-[var(--shadow-glow)] animate-in fade-in slide-in-from-top-4 duration-500">
            <p className="text-primary font-semibold text-sm tracking-wider uppercase mb-1">
              {webDev.greeting}
            </p>
            <h3 className="font-display text-2xl lg:text-3xl font-bold mb-4">{webDev.headline}</h3>
            <div className="space-y-4 text-foreground/85 leading-relaxed text-justify max-w-4xl">
              {webDev.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div
              className="mt-8 rounded-xl p-6 border border-border/60"
              style={{ background: "var(--grad-amber)" }}
            >
              <h4 className="font-display text-xl lg:text-2xl font-bold text-primary-foreground mb-2">
                {webDev.tagline}
              </h4>
              <p className="text-primary-foreground/90 text-sm lg:text-base leading-relaxed">
                {webDev.subTagline}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {webDev.shortTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Web Design Detail */}
        {expandedService === "webDesign" && (
          <div className="mt-6 bg-card/80 backdrop-blur rounded-2xl border border-border/60 p-8 lg:p-10 shadow-[var(--shadow-glow)] animate-in fade-in slide-in-from-top-4 duration-500">
            <p className="text-primary font-semibold text-sm tracking-wider uppercase mb-1">
              {webDesign.greeting}
            </p>
            <h3 className="font-display text-2xl lg:text-3xl font-bold mb-4">
              {webDesign.headline}
            </h3>
            <div className="space-y-4 text-foreground/85 leading-relaxed text-justify max-w-4xl">
              {webDesign.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div
              className="mt-8 rounded-xl p-6 border border-border/60"
              style={{ background: "var(--grad-amber)" }}
            >
              <h4 className="font-display text-xl lg:text-2xl font-bold text-primary-foreground mb-2">
                {webDesign.tagline}
              </h4>
              <p className="text-primary-foreground/90 text-sm lg:text-base leading-relaxed">
                {webDesign.subTagline}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {webDesign.shortTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Data Analysis & Machine Learning Detail */}
        {expandedService === "dataAnalysis" && (
          <div className="mt-6 bg-card/80 backdrop-blur rounded-2xl border border-border/60 p-8 lg:p-10 shadow-[var(--shadow-glow)] animate-in fade-in slide-in-from-top-4 duration-500">
            <p className="text-primary font-semibold text-sm tracking-wider uppercase mb-1">
              {dataAnalysis.greeting}
            </p>
            <h3 className="font-display text-2xl lg:text-3xl font-bold mb-4">
              {dataAnalysis.headline}
            </h3>
            <div className="space-y-4 text-foreground/85 leading-relaxed text-justify max-w-4xl">
              {dataAnalysis.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div
              className="mt-8 rounded-xl p-6 border border-border/60"
              style={{ background: "var(--grad-amber)" }}
            >
              <h4 className="font-display text-xl lg:text-2xl font-bold text-primary-foreground mb-2">
                {dataAnalysis.tagline}
              </h4>
              <p className="text-primary-foreground/90 text-sm lg:text-base leading-relaxed">
                {dataAnalysis.subTagline}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {dataAnalysis.shortTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Application Detail */}
        {expandedService === "mobileApp" && (
          <div className="mt-6 bg-card/80 backdrop-blur rounded-2xl border border-border/60 p-8 lg:p-10 shadow-[var(--shadow-glow)] animate-in fade-in slide-in-from-top-4 duration-500">
            <p className="text-primary font-semibold text-sm tracking-wider uppercase mb-1">
              {mobileApp.greeting}
            </p>
            <h3 className="font-display text-2xl lg:text-3xl font-bold mb-4">
              {mobileApp.headline}
            </h3>
            <div className="space-y-4 text-foreground/85 leading-relaxed text-justify max-w-4xl">
              {mobileApp.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div
              className="mt-8 rounded-xl p-6 border border-border/60"
              style={{ background: "var(--grad-amber)" }}
            >
              <h4 className="font-display text-xl lg:text-2xl font-bold text-primary-foreground mb-2">
                {mobileApp.tagline}
              </h4>
              <p className="text-primary-foreground/90 text-sm lg:text-base leading-relaxed">
                {mobileApp.subTagline}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {mobileApp.shortTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div
          className="mt-10 rounded-xl p-8 flex flex-col lg:flex-row gap-6 lg:items-center justify-between shadow-[var(--shadow-glow)]"
          style={{ background: "var(--grad-amber)" }}
        >
          <p className="font-display text-2xl lg:text-3xl font-bold leading-tight text-primary-foreground">
            I am happy to know you that 30+ projects done successfully!!!
          </p>
          <a
            href="#contact"
            className="bg-[oklch(0.2_0.04_265)] hover:bg-[oklch(0.25_0.04_265)] text-primary font-bold tracking-widest px-6 py-3 rounded-md text-sm whitespace-nowrap"
          >
            HIRE ME
          </a>
        </div>
      </Section>

      {/* Education */}
      <Section id="education" eyebrow="Education" title="My Education">
        <div className="max-w-3xl">
          {education.map((e) => (
            <TimelineItem key={e.title} color={e.color}>
              <p className="font-semibold">
                {e.title}{" "}
                <span className="text-muted-foreground font-normal text-sm ml-1">{e.year}</span>
              </p>
              <p className="italic text-sm text-muted-foreground mt-1">{e.place}</p>
            </TimelineItem>
          ))}
        </div>
      </Section>

      {/* Skills */}
      <Section id="skills" eyebrow="My Speciality" title="My Skills">
        <div className="grid md:grid-cols-2 gap-x-12">
          {skills.map((s) => (
            <SkillBar key={s.name} {...s} />
          ))}
        </div>
      </Section>

      {/* Experience */}
      <Section id="experience" eyebrow="Experience" title="Work Experience">
        <div className="max-w-4xl">
          {experience.map((x) => (
            <TimelineItem key={x.title} color={x.color}>
              <p className="font-semibold">
                {x.title}{" "}
                <span className="text-muted-foreground font-normal text-sm ml-2">{x.range}</span>
              </p>
              <p className="italic text-sm text-muted-foreground mt-0.5">{x.place}</p>
              <ul className="mt-3 space-y-1 text-sm text-foreground/85">
                {x.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </TimelineItem>
          ))}
        </div>
      </Section>

      {/* Work */}
      <WorkSection />

      {/* Accomplishment */}
      <Section id="accomplishment" eyebrow="Accomplishment" title="My Accomplishment">
        <div className="max-w-3xl">
          {accomplishments.map((a) => (
            <TimelineItem key={a.title} color={a.color}>
              <p className="font-semibold">
                {a.title}{" "}
                <span className="text-muted-foreground font-normal text-sm ml-1">{a.year}</span>
              </p>
            </TimelineItem>
          ))}
        </div>
      </Section>

      {/* Blog */}
      <Section id="blog" eyebrow="My Blog" title="Recent Blog">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.slice(0, 3).map((b) => (
            <BlogCard blog={b} key={b.slug} />
          ))}
        </div>
        <Link
          to="/blogs"
          style={{ background: "var(--grad-amber)" }}
          className="mt-8 flex items-center justify-center gap-2 w-full text-primary-foreground py-4 rounded-md font-bold tracking-wider hover:opacity-90 shadow-[var(--shadow-glow)]"
        >
          See All Blogs <ExternalLink size={16} />
        </Link>
      </Section>

      {/* Contact */}
      <Section id="contact" eyebrow="Get In Touch" title="Contact">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <ContactInfo icon={<Mail />} text={profile.email} copyLabel="Email address" />
            <ContactInfo icon={<MapPin />} text={profile.address} />
            <ContactInfo icon={<Phone />} text={profile.phone} copyLabel="Mobile number" />
          </div>
          <ContactForm />
        </div>
      </Section>

      {/* Footer */}
      {/* Footer */}
      <footer className="border-t px-6 lg:px-16 py-10 text-center">
        <p className="font-display font-semibold mb-4">Follow Me</p>
        <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
          {/* Website */}
          <SocialButton
            href="https://www.dipaksingh.com.np/"
            label="Website"
            icon={<Globe2 size={24} />}
          />

          {/* GitHub */}
          <SocialButton
            href="https://github.com/dipakkmahato"
            label="GitHub"
            icon={<Github size={24} />}
          />

          {/* LinkedIn */}
          <SocialButton
            href="https://www.linkedin.com/in/dipak-kumar-singh-591670294"
            label="LinkedIn"
            icon={<Linkedin size={24} />}
          />

          {/* Facebook */}
          <SocialButton
            href="https://www.facebook.com/Dipak.Singh.07"
            label="Facebook"
            icon={<Facebook size={24} />}
          />

          {/* YouTube */}
          <SocialButton
            href="https://www.youtube.com/@dipakkumarsingh2473"
            label="YouTube"
            icon={<Youtube size={24} />}
          />

          {/* TikTok */}
          <SocialButton
            href="https://www.tiktok.com/@dipak_singh099"
            label="TikTok"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            }
          />
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} {profile.name}. All rights reserved.
        </p>
      </footer>
    </>
  );
}

function SocialButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const isMail = href.startsWith("mailto:");
  return (
    <button
      type="button"
      aria-label={label}
      className="hover:text-[var(--link)] transition-colors cursor-pointer"
      onClick={() => {
        if (isMail) {
          window.location.href = href;
        } else {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      }}
    >
      {icon}
    </button>
  );
}

function ContactInfo({
  icon,
  text,
  copyLabel,
}: {
  icon: React.ReactNode;
  text: string;
  copyLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    if (!copyLabel) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${copyLabel} copied`);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error(`Could not copy ${copyLabel.toLowerCase()}`);
    }
  };

  const content = (
    <div
      className={`group flex items-center gap-4 bg-card/70 backdrop-blur border border-border/60 rounded-xl p-4 transition-colors ${
        copyLabel ? "cursor-copy hover:border-primary/60 hover:bg-card" : ""
      }`}
    >
      <div className="h-12 w-12 rounded-lg grid place-items-center bg-primary/15 text-primary border border-primary/30 shrink-0">
        {icon}
      </div>
      <span className="text-foreground/90 flex-1 break-words">{text}</span>
      {copyLabel && (
        <span
          className="text-primary opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </span>
      )}
    </div>
  );

  return copyLabel ? (
    <button
      type="button"
      onClick={copyText}
      aria-label={`Copy ${copyLabel}`}
      className="w-full text-left"
    >
      {content}
    </button>
  ) : (
    content
  );
}
