export function Section({
  id,
  eyebrow,
  title,
  description,
  aside,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-6 pt-16 sm:pt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2.5">
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="section-title text-balance">{title}</h2>
          {description && <p className="text-[15px] font-light leading-relaxed text-ink-muted">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-ink-muted">{children}</p>;
}
