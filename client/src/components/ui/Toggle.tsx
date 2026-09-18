export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/10 bg-ink-900/70 p-4 text-left transition duration-180 hover:border-white/16"
    >
      <span>
        <span className="block text-sm font-medium text-mist-100">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-mist-500">{description}</span>
      </span>
      <span
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition duration-220 ${checked ? 'bg-accent' : 'bg-ink-500'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition duration-220 ${checked ? 'left-5' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}
