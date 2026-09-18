import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-mist-100">{label}</span>
      {children}
      {error ? (
        <span className="block animate-fade-up text-xs text-red-300">{error}</span>
      ) : hint ? (
        <span className="block text-xs leading-5 text-mist-500">{hint}</span>
      ) : null}
    </label>
  );
}

const control =
  'w-full rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-500 outline-none transition duration-180 focus:border-accent/50 focus:ring-2 focus:ring-accent/20';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${control} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${control} min-h-[96px] resize-y ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${control} ${className}`} {...props} />;
}
