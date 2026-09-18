export function Progress({ value, label }: { value: number; label?: string }) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-sm text-mist-300">
          <span>{label}</span>
          <span className="tabular">{Math.round(width)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-ink-600">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-280 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
