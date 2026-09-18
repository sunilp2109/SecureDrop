import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, QrCode, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { AppShell } from '../components/layout/AppShell';
import { EncryptVisual } from '../components/security/EncryptVisual';
import { SecurityChecklist, type ChecklistItem } from '../components/security/SecurityChecklist';
import { SecurityFlags } from '../components/security/SecurityFlags';
import { FileDropzone } from '../components/send/FileDropzone';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Field, Input, Select } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { Progress } from '../components/ui/Progress';
import { Toggle } from '../components/ui/Toggle';
import { useToast } from '../components/ui/Toast';
import { ApiError, createShare } from '../lib/api';
import { encryptFile, PBKDF2_ITERATIONS } from '../lib/crypto';
import { copyText, formatBytes, isValidEmail } from '../lib/format';
import { dropSession } from '../lib/session';
import type { CreateShareResult } from '../types';

type Step = 'upload' | 'security' | 'encrypting' | 'secured' | 'emailed';

const stepIndex: Record<Step, number> = {
  upload: 0,
  security: 1,
  encrypting: 2,
  secured: 3,
  emailed: 4,
};

export function SendPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [passwordEnabled, setPasswordEnabled] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [maxDownloads, setMaxDownloads] = useState(1);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Starting');
  const [error, setError] = useState('');
  const [result, setResult] = useState<CreateShareResult | null>(null);
  const [dekFragment, setDekFragment] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fullAccessUrl = useMemo(() => {
    if (!result) return '';
    if (dekFragment) return `${result.accessUrl}#k=${dekFragment}`;
    return result.accessUrl;
  }, [result, dekFragment]);

  function validateSecurity() {
    if (!isValidEmail(email)) return 'Enter a valid recipient email address.';
    if (passwordEnabled) {
      if (password.length < 8) return 'Use a password of at least 8 characters.';
      if (password !== confirm) return 'Password confirmation does not match.';
    }
    return '';
  }

  async function secureFile() {
    if (!file) return;
    const message = validateSecurity();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setSending(true);
    setStep('encrypting');
    setProgress(4);
    setProgressLabel('Preparing encryption');

    try {
      const encrypted = await encryptFile(file, passwordEnabled ? password : null, (value, label) => {
        setProgress(Math.min(value, 84));
        setProgressLabel(label);
      });

      const form = new FormData();
      form.set('file', encrypted.ciphertext, 'payload.bin');
      form.set('recipientEmail', email.trim().toLowerCase());
      form.set('originalFilename', file.name);
      form.set('mimeType', file.type || 'application/octet-stream');
      form.set('sha256', encrypted.sha256);
      form.set('iv', encrypted.iv);
      form.set('passwordEnabled', String(passwordEnabled));
      form.set('otpEnabled', String(otpEnabled));
      form.set('expiresInHours', String(expiresInHours));
      form.set('maxDownloads', String(maxDownloads));
      if (passwordEnabled) {
        form.set('password', password);
        form.set('wrappedDek', encrypted.wrappedDek ?? '');
        form.set('kdfSalt', encrypted.kdfSalt ?? '');
        form.set('kdfIterations', String(encrypted.kdfIterations ?? PBKDF2_ITERATIONS));
      }

      setProgressLabel('Uploading ciphertext');
      const created = await createShare(form, (upload) => {
        setProgress(84 + Math.round(upload * 0.12));
      });

      setProgress(98);
      setProgressLabel('Finishing');
      setResult(created);
      setDekFragment(encrypted.dekFragment);
      dropSession.save({
        id: created.id,
        manageToken: created.manageToken,
        accessToken: created.accessToken,
        accessUrl: created.accessUrl,
        fileName: file.name,
        recipientEmail: email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
        expiresAt: created.expiresAt,
        emailDelivered: created.emailDelivered,
        passwordEnabled: created.passwordEnabled,
        otpEnabled: created.otpEnabled,
        maxDownloads,
        dekFragment: encrypted.dekFragment,
      });
      setProgress(100);
      setStep('secured');
      toast(created.emailDelivered ? 'Encrypted file stored. Email sent.' : 'File secured. Email was not delivered.', created.emailDelivered ? 'good' : 'warn');
    } catch (err) {
      const fallback = err instanceof ApiError ? err.message : 'Could not secure this file.';
      setError(fallback);
      toast(fallback, 'bad');
      setStep('security');
    } finally {
      setSending(false);
    }
  }

  async function showQr() {
    if (!fullAccessUrl) return;
    setQr(await QRCode.toDataURL(fullAccessUrl, { margin: 1, width: 280, color: { dark: '#05070A', light: '#ECFDF5' } }));
  }

  async function copyLink() {
    const ok = await copyText(fullAccessUrl);
    if (ok) {
      setCopied(true);
      toast('Secure link copied', 'good');
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <AppShell>
      <Wizard current={stepIndex[step]} />
      <div className="mt-6 animate-fade-up">
        {step === 'upload' ? (
          <Card className="p-6 sm:p-8">
            <CardHeader
              eyebrow="Send secure file"
              title="Choose the file to protect"
              description="The file never leaves this device until it is encrypted with AES-256-GCM."
            />
            <div className="mt-8">
              <FileDropzone file={file} onFile={setFile} />
            </div>
            <div className="mt-6 flex justify-end">
              <Button className="w-full sm:w-auto" disabled={!file} onClick={() => setStep('security')}>
                Continue
              </Button>
            </div>
          </Card>
        ) : null}

        {step === 'security' ? (
          <Card className="p-6 sm:p-8">
            <CardHeader
              eyebrow="Security configuration"
              title="Set the access policy"
              description="Recipient email, password, OTP, expiry, and download limit are enforced on the server."
            />
            <div className="mt-8 space-y-5">
              <Field label="Recipient email" hint="The access link is emailed here. The file is never attached." error={error && !email ? error : undefined}>
                <Input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="recipient@example.com" />
              </Field>
              <Toggle
                checked={passwordEnabled}
                onChange={setPasswordEnabled}
                label="Password protection"
                description="The file key is wrapped with this password. Share the password out of band, not in the same email."
              />
              <div className={`grid gap-4 overflow-hidden transition-all duration-280 sm:grid-cols-2 ${passwordEnabled ? 'max-h-40 opacity-100' : 'pointer-events-none max-h-0 opacity-0'}`}>
                {passwordEnabled ? (
                  <>
                    <Field label="Password">
                      <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </Field>
                    <Field label="Confirm password">
                      <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </Field>
                  </>
                ) : null}
              </div>
              <Toggle
                checked={otpEnabled}
                onChange={setOtpEnabled}
                label="OTP verification"
                description="A one-time code is emailed to the recipient when they open the link."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Expires after">
                  <Select value={expiresInHours} onChange={(e) => setExpiresInHours(Number(e.target.value))}>
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>7 days</option>
                  </Select>
                </Field>
                <Field label="Download limit">
                  <Select value={maxDownloads} onChange={(e) => setMaxDownloads(Number(e.target.value))}>
                    <option value={1}>1 download</option>
                    <option value={3}>3 downloads</option>
                    <option value={5}>5 downloads</option>
                    <option value={10}>10 downloads</option>
                  </Select>
                </Field>
              </div>
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button className="w-full sm:w-auto" loading={sending} onClick={() => void secureFile()}>
                  Encrypt and send
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {step === 'encrypting' ? (
          <Card className="p-6 sm:p-8">
            <CardHeader eyebrow="Encryption progress" title="Securing the file locally" description="Key generation, encryption, and hashing all happen in your browser." />
            <div className="mt-10 space-y-8">
              <EncryptVisual progress={progress} />
              <Progress value={progress} label={progressLabel} />
              <SecurityChecklist items={encryptChecklist(progress)} />
              <p className="text-sm text-mist-500">The original file is not uploaded. Only ciphertext is sent after encryption completes.</p>
            </div>
          </Card>
        ) : null}

        {step === 'secured' && result ? (
          <Card className="p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent animate-check-pop">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="mt-4">
              <CardHeader
                eyebrow="File secured"
                title="The ciphertext is stored. The key is not."
                description="A temporary access link was generated. Encryption keys are never returned by the API for logging or display beyond this page."
              />
            </div>
            <div className="mt-6">
              <SecurityFlags passwordEnabled={result.passwordEnabled} otpEnabled={result.otpEnabled} />
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-ink-900 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-mist-500">Secure access link</p>
              <p className="mt-2 break-all font-mono text-xs text-mist-200">{fullAccessUrl}</p>
            </div>
            <p className="mt-3 text-xs leading-5 text-mist-500">
              {result.passwordEnabled
                ? 'The email contains the access link only. Share the password separately.'
                : 'The email contains the access path only. The decryption key lives in the #k fragment of this full link and is not emailed.'}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button className="w-full sm:w-auto" onClick={() => void copyLink()}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy full link'}
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => void showQr()}>
                <QrCode className="h-4 w-4" />
                QR code
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setStep('emailed')}>
                Continue
              </Button>
            </div>
          </Card>
        ) : null}

        {step === 'emailed' && result ? (
          <Card className="p-6 sm:p-8">
            <CardHeader
              eyebrow="Email"
              title={result.emailDelivered ? 'The secure link is on its way' : 'Link created. Email is in local outbox'}
              description={
                result.emailDelivered
                  ? `An Open Secure File email was sent to ${email}. The file was not attached.`
                  : 'SMTP is not configured, so the message was written to the server outbox. The recipient still needs the access link.'
              }
            />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="w-full sm:w-auto" onClick={() => navigate(`/dashboard/${result.manageToken}`)}>
                Open security dashboard
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => navigate('/')}>
                Done
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal open={Boolean(qr)} title="QR code" onClose={() => setQr(null)}>
        {qr ? <img src={qr} alt="Secure access QR code" className="mx-auto rounded-xl" /> : null}
        <p className="mt-4 text-center text-xs text-mist-500">Contains the same full link shown on this page.</p>
      </Modal>

      {file && step !== 'upload' ? (
        <p className="mt-4 text-center text-xs text-mist-500">
          {file.name} · {formatBytes(file.size)}
        </p>
      ) : null}
    </AppShell>
  );
}

function Wizard({ current }: { current: number }) {
  const labels = ['File', 'Policy', 'Encrypt', 'Link', 'Email'];
  return (
    <ol className="grid grid-cols-5 gap-2 text-[11px] uppercase tracking-[0.12em] text-mist-500">
      {labels.map((label, index) => (
        <li key={label} className="text-center">
          <span className={`block h-1 rounded-full ${index <= current ? 'bg-accent' : 'bg-ink-600'}`} />
          <span className={`mt-2 hidden sm:block ${index === current ? 'text-accent' : ''}`}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function encryptChecklist(progress: number): ChecklistItem[] {
  return [
    { label: 'Read file in browser', state: progress >= 10 ? 'done' : 'processing' },
    { label: 'Generate AES-256-GCM key', state: progress < 22 ? 'pending' : progress < 48 ? 'processing' : 'done' },
    { label: 'Encrypt locally', state: progress < 48 ? 'pending' : progress < 68 ? 'processing' : 'done' },
    { label: 'SHA-256 integrity hash', state: progress < 68 ? 'pending' : progress < 84 ? 'processing' : 'done' },
    { label: 'Upload ciphertext', state: progress < 84 ? 'pending' : progress < 100 ? 'processing' : 'done' },
  ];
}
