import { useEffect, useId, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const headingId = useId();
  const [present, setPresent] = useState(open);

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    const id = window.setTimeout(() => setPresent(false), 180);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!present) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <button
        aria-label="Close dialog"
        className={`absolute inset-0 bg-black/70 transition duration-220 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-800 p-6 shadow-card transition duration-220 ${
          open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={headingId} className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-mist-400 transition hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
