import { Check, FileLock, FileText, ShieldCheck } from 'lucide-react';

export function EncryptVisual({ progress }: { progress: number }) {
  const stage = progress >= 96 ? 3 : progress >= 62 ? 2 : progress >= 22 ? 1 : 0;
  const Icon = [FileText, FileLock, ShieldCheck, Check][stage];
  const labels = ['Reading file', 'Encrypting', 'Verifying integrity', 'Secured'];

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent motion-safe:transition-transform motion-safe:duration-280">
        <Icon className="h-7 w-7" key={stage} />
      </div>
      <p className="mt-3 text-sm font-medium text-white">{labels[stage]}</p>
    </div>
  );
}
