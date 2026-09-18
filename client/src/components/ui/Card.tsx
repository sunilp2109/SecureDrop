import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-white/[0.07] bg-ink-800/90 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{title}</h1>
      {description ? <p className="max-w-2xl text-sm leading-6 text-mist-400">{description}</p> : null}
    </div>
  );
}
