import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type Tone = 'good' | 'bad' | 'warn' | 'neutral';

type ToastItem = {
  id: number;
  title: string;
  tone: Tone;
};

type ToastContextValue = {
  toast: (title: string, tone?: Tone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  good: CheckCircle2,
  bad: XCircle,
  warn: AlertTriangle,
  neutral: Info,
};

const tones = {
  good: 'border-emerald-400/20 bg-ink-800 text-emerald-200',
  bad: 'border-red-400/20 bg-ink-800 text-red-200',
  warn: 'border-amber-400/20 bg-ink-800 text-amber-200',
  neutral: 'border-white/10 bg-ink-800 text-mist-100',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((title: string, tone: Tone = 'neutral') => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current.slice(-3), { id, title, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {items.map((item) => {
          const Icon = icons[item.tone];
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-toast animate-fade-up ${tones[item.tone]}`}
              role="status"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 leading-5">{item.title}</p>
              <button
                type="button"
                className="rounded-md p-1 text-mist-500 hover:text-white"
                onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
