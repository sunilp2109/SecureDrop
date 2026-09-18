import { Link } from 'react-router-dom';
import { Fingerprint, LockKeyhole, Mail, ShieldCheck, TimerReset } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';

const features = [
  {
    icon: LockKeyhole,
    title: 'Encrypted before it leaves',
    body: 'AES-256-GCM runs in the browser. The server stores ciphertext, never a readable file.',
  },
  {
    icon: Fingerprint,
    title: 'Integrity is proven',
    body: 'SHA-256 of the ciphertext is checked on download. Tampering stops the save.',
  },
  {
    icon: TimerReset,
    title: 'Access dies on a timer',
    body: 'Expiry and download limits are enforced server-side, then the object is deleted.',
  },
  {
    icon: Mail,
    title: 'Email the door, not the file',
    body: 'Recipients get a short-lived link. Keys and attachments never go in the message.',
  },
];

const steps = [
  { n: '01', title: 'Upload', body: 'Choose a file. It stays on this device until it is encrypted.' },
  { n: '02', title: 'Set policy', body: 'Recipient, password, OTP, expiry, and download limit.' },
  { n: '03', title: 'Send the link', body: 'Ciphertext is stored. A temporary access link is emailed.' },
  { n: '04', title: 'Verify & decrypt', body: 'The recipient authenticates, checks integrity, and decrypts locally.' },
];

export function LandingPage() {
  return (
    <AppShell wide>
      <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="animate-fade-up">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Anonymous file sharing</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            Share files. Leave no trace.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-mist-400">
            SecureDrop encrypts on the sender’s device, emails a temporary access link, and deletes the ciphertext when the policy expires. No accounts. No lingering copies.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/send"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-lift transition duration-180 hover:bg-accent-dim motion-safe:hover:-translate-y-px sm:w-auto"
            >
              Send a secure file
            </Link>
            <Link
              to="/security"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-ink-700/80 px-4 py-2.5 text-sm font-semibold text-mist-100 transition duration-180 hover:border-white/16 hover:bg-ink-600 sm:w-auto"
            >
              How it works
            </Link>
          </div>
          <p className="mt-6 text-xs text-mist-500">Secure by design, simple by default.</p>
        </div>

        <Card className="animate-scale-in p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">Zero-knowledge by default</p>
              <p className="text-xs text-mist-500">Plaintext never reaches the server</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-mist-300">
            {[
              'Client-side AES-256-GCM',
              'Password and OTP gates',
              'Short-lived tokens',
              'Automatic deletion',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="stagger mt-16 grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="p-5 transition duration-220 hover:border-white/12">
            <feature.icon className="h-5 w-5 text-accent" />
            <h2 className="mt-4 text-base font-semibold text-white">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-mist-400">{feature.body}</p>
          </Card>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-semibold text-white">The path a file takes</h2>
        <div className="stagger mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Card key={step.n} className="p-4">
              <p className="font-mono text-[11px] text-accent">{step.n}</p>
              <p className="mt-2 text-sm font-medium text-white">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-mist-400">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
