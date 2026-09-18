import { Check, LoaderCircle } from 'lucide-react';

export type ChecklistItem = {
  label: string;
  state: 'pending' | 'processing' | 'done';
};

export function SecurityChecklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-900/70 px-3 py-2.5 text-sm">
          {item.state === 'done' ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent animate-check-pop">
              <Check className="h-3 w-3" />
            </span>
          ) : item.state === 'processing' ? (
            <LoaderCircle className="h-5 w-5 animate-spin text-accent" />
          ) : (
            <span className="h-5 w-5 rounded-full border border-white/15" />
          )}
          <span className={item.state === 'pending' ? 'text-mist-500' : 'text-mist-100'}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
