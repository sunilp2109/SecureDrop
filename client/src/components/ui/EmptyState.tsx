import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionTo,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionTo?: string;
  actionLabel?: string;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-ink-900 text-mist-400">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mist-400">{body}</p>
      {actionTo && actionLabel ? (
        <Link
          to={actionTo}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 transition duration-180 hover:bg-accent-dim"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorState({
  icon: Icon,
  title,
  body,
  tone = 'bad',
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone?: 'bad' | 'warn';
}) {
  const color = tone === 'warn' ? 'text-amber-300 bg-amber-400/10' : 'text-red-300 bg-red-400/10';
  return (
    <div className="animate-scale-in px-6 py-12 text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-mist-400">{body}</p>
    </div>
  );
}
