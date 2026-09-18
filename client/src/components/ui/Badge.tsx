export function Badge({
  children,
  tone = 'neutral',
}: {
  children: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent';
}) {
  const tones = {
    neutral: 'border-white/10 bg-white/5 text-mist-300',
    good: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    warn: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
    bad: 'border-red-400/25 bg-red-400/10 text-red-300',
    accent: 'border-accent/25 bg-accent/10 text-accent',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
