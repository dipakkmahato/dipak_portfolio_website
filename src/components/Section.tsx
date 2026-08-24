import { ReactNode } from "react";

export function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
    </div>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 px-6 lg:px-16 py-16 lg:py-24">
      {eyebrow && title && <SectionHeader eyebrow={eyebrow} title={title} />}
      {children}
    </section>
  );
}
