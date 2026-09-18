import { AppShell } from '../components/layout/AppShell';
import { Card, CardHeader } from '../components/ui/Card';

export function EmailTemplatePage() {
  return (
    <AppShell>
      <CardHeader
        eyebrow="Email template"
        title="What the recipient receives"
        description="Production messages use this layout. The file is never attached, and encryption keys are never included."
      />
      <Card className="mt-8 overflow-hidden p-0">
        <div className="bg-ink-950 p-6 sm:p-10">
          <div className="mx-auto max-w-[560px] rounded-3xl border border-white/10 bg-ink-800 p-8 shadow-card">
            <p className="text-[12px] uppercase tracking-[0.16em] text-accent">SecureDrop</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">A secure file is waiting for you</h2>
            <p className="mt-3 text-sm leading-6 text-mist-400">
              Someone sent you an encrypted file. The file itself is not attached to this email.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-ink-900 p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-mist-500">File</p>
              <p className="mt-1 text-base text-white">quarterly-report.pdf</p>
              <p className="mt-2 text-sm text-mist-400">1.4 MB · Expires Sep 18, 2026, 7:00 PM</p>
            </div>
            <p className="mt-6 text-sm leading-7 text-mist-300">
              AES-256-GCM encryption
              <br />
              SHA-256 integrity verification
              <br />
              Password protection
              <br />
              OTP verification
              <br />
              1 download maximum
            </p>
            <button type="button" className="mt-6 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-ink-950">
              Open Secure File
            </button>
            <p className="mt-6 text-xs leading-5 text-mist-500">
              This message does not contain encryption keys, passwords, or the file itself.
            </p>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
