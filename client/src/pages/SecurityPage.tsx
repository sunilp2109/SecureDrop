import { Link } from 'react-router-dom';
import { LockKeyhole, Mail, ScanLine, TimerReset, Trash2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardHeader } from '../components/ui/Card';

const items = [
  {
    icon: LockKeyhole,
    title: 'Encryption happens first',
    body: 'AES-256-GCM runs in the browser with a random 256-bit key. If a password is set, that key is wrapped with PBKDF2 before anything is uploaded.',
  },
  {
    icon: ScanLine,
    title: 'Integrity is measured, then checked',
    body: 'SHA-256 of the ciphertext is stored with the drop. The recipient recomputes it before decryption. Mismatches abort the save.',
  },
  {
    icon: Mail,
    title: 'Email carries the door, not the key',
    body: 'The recipient email contains the file name, policy, expiry, and an Open Secure File button. It does not include the file, the DEK, or a password.',
  },
  {
    icon: TimerReset,
    title: 'Access is short-lived',
    body: 'Open-link tokens, download grants, and OTPs all expire. Download limits and revocation are enforced on the server.',
  },
  {
    icon: Trash2,
    title: 'Deletion is automatic',
    body: 'Expired, revoked, and exhausted drops have their ciphertext removed. Metadata may remain briefly so the correct blocked screen can be shown.',
  },
];

export function SecurityPage() {
  return (
    <AppShell>
      <CardHeader
        eyebrow="Security"
        title="How SecureDrop works"
        description="No user accounts. Authorization is the possession of unguessable tokens, plus optional password and OTP gates."
      />
      <div className="stagger mt-8 space-y-4">
        {items.map((item) => (
          <Card key={item.title} className="p-5">
            <item.icon className="h-5 w-5 text-accent" />
            <h2 className="mt-3 text-base font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-mist-400">{item.body}</p>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-sm text-mist-500">
        Preview the recipient email at{' '}
        <Link to="/security/email" className="text-accent transition hover:text-accent-dim">
          /security/email
        </Link>
        .
      </p>
    </AppShell>
  );
}
