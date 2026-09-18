import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary:
    'bg-accent text-ink-950 shadow-lift hover:bg-accent-dim disabled:bg-accent/35 disabled:text-ink-950/60 disabled:shadow-none',
  secondary:
    'border border-white/10 bg-ink-700/80 text-mist-100 hover:border-white/16 hover:bg-ink-600 disabled:opacity-50',
  ghost: 'text-mist-300 hover:bg-white/5 hover:text-white disabled:opacity-40',
  danger:
    'border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/16 disabled:opacity-50',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode; loading?: boolean }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-180 motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:translate-y-0 disabled:scale-100 ${styles[variant]} ${className}`}
      {...props}
      disabled={props.disabled || loading}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
