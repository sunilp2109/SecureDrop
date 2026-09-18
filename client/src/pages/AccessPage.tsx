import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileWarning, Hourglass, ShieldOff, ShieldX } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Countdown } from '../components/security/Countdown';
import { SecurityChecklist } from '../components/security/SecurityChecklist';
import { SecurityFlags } from '../components/security/SecurityFlags';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ErrorState } from '../components/ui/EmptyState';
import { Field, Input } from '../components/ui/Field';
import { OTPInput } from '../components/ui/OTPInput';
import { Progress } from '../components/ui/Progress';
import { useToast } from '../components/ui/Toast';
import { api, ApiError } from '../lib/api';
import { decryptFile, readKeyFromHash, sha256Hex } from '../lib/crypto';
import { formatBytes, triggerBlobDownload } from '../lib/format';
import type { AccessMetadata, DownloadSecrets } from '../types';

type Gate = 'loading' | 'overview' | 'password' | 'otp' | 'integrity' | 'success' | 'expired' | 'limit' | 'revoked' | 'invalid';

export function AccessPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gate, setGate] = useState<Gate>('loading');
  const [meta, setMeta] = useState<AccessMetadata | null>(null);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Verifying');
  const dekFragment = useMemo(() => readKeyFromHash(), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.access(token);
        if (cancelled) return;
        setMeta(data);
        if (data.status === 'expired') setGate('expired');
        else if (data.status === 'limit') setGate('limit');
        else if (data.status === 'revoked') setGate('revoked');
        else setGate('overview');
      } catch {
        if (!cancelled) setGate('invalid');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function applyBlocked(err: unknown) {
    if (err instanceof ApiError) {
      if (err.code === 'expired') return setGate('expired');
      if (err.code === 'download_limit') return setGate('limit');
      if (err.code === 'revoked') return setGate('revoked');
      setError(err.message);
      toast(err.message, 'bad');
      return;
    }
    setError('Something went wrong. Please try again.');
    toast('Something went wrong. Please try again.', 'bad');
  }

  async function continueFromOverview() {
    setError('');
    if (!meta) return;
    if (meta.passwordEnabled) {
      setGate('password');
      return;
    }
    if (meta.otpEnabled) {
      setBusy(true);
      try {
        const sent = await api.requestOtp(token);
        setOtpHint(sent.destination);
        setGate('otp');
      } catch (err) {
        applyBlocked(err);
      } finally {
        setBusy(false);
      }
      return;
    }
    await startDownload();
  }

  async function submitPassword() {
    setBusy(true);
    setError('');
    try {
      const result = await api.verifyPassword(token, password);
      if (result.next === 'otp') {
        const sent = await api.requestOtp(token);
        setOtpHint(sent.destination);
        setGate('otp');
        return;
      }
      await finishDownload(result as DownloadSecrets);
    } catch (err) {
      applyBlocked(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    setBusy(true);
    setError('');
    try {
      const result = await api.verifyOtp(token, otp);
      await finishDownload(result);
    } catch (err) {
      applyBlocked(err);
    } finally {
      setBusy(false);
    }
  }

  async function startDownload() {
    setBusy(true);
    setError('');
    try {
      const result = await api.grant(token);
      await finishDownload(result);
    } catch (err) {
      applyBlocked(err);
    } finally {
      setBusy(false);
    }
  }

  async function finishDownload(secrets: DownloadSecrets) {
    if (!secrets.grantToken) {
      setError('Download authorization was not issued.');
      setGate('overview');
      return;
    }
    setGate('integrity');
    setProgress(12);
    setProgressLabel('Fetching ciphertext');
    try {
      const ciphertext = await api.download(secrets.grantToken);
      setProgress(48);
      setProgressLabel('Verifying SHA-256');
      const digest = await sha256Hex(ciphertext);
      if (digest !== secrets.sha256) {
        setError('Integrity verification failed. The file was not written to disk.');
        toast('Integrity verification failed.', 'bad');
        setGate('overview');
        return;
      }
      setProgress(72);
      setProgressLabel('Decrypting in the browser');
      const blob = await decryptFile({
        ciphertext,
        iv: secrets.iv,
        sha256: secrets.sha256,
        password: secrets.passwordEnabled ? password : undefined,
        wrappedDek: secrets.wrappedDek,
        kdfSalt: secrets.kdfSalt,
        kdfIterations: secrets.kdfIterations,
        dekFragment: secrets.passwordEnabled ? null : dekFragment,
      });
      setProgress(92);
      setProgressLabel('Saving decrypted file');
      triggerBlobDownload(blob, secrets.fileName);
      setProgress(100);
      setGate('success');
      toast('Download completed', 'good');
    } catch {
      setError('Decryption failed. Check the password or the key fragment in the link.');
      toast('Decryption failed.', 'bad');
      setGate('overview');
    }
  }

  if (gate === 'loading') {
    return (
      <AppShell>
        <Card className="p-8 text-sm text-mist-400">Checking this secure link…</Card>
      </AppShell>
    );
  }

  if (gate === 'invalid') {
    return (
      <Blocked
        icon={ShieldX}
        title="This secure link is invalid"
        body="The token may be mistyped, or the drop may already have been deleted."
      />
    );
  }

  if (gate === 'expired') {
    return (
      <Blocked
        icon={Hourglass}
        title="This link has expired"
        body="The access window closed and the encrypted file has been scheduled for deletion."
        tone="warn"
      />
    );
  }

  if (gate === 'limit') {
    return (
      <Blocked
        icon={FileWarning}
        title="Download limit reached"
        body="No further downloads are allowed for this drop. The ciphertext is removed once the limit is used."
        tone="warn"
      />
    );
  }

  if (gate === 'revoked') {
    return (
      <Blocked
        icon={ShieldOff}
        title="Access has been revoked"
        body="The sender revoked this drop. The encrypted object is no longer available."
      />
    );
  }

  return (
    <AppShell>
      <div className="animate-fade-up">
        {gate === 'overview' && meta ? (
          <Card className="p-6 sm:p-8">
            <CardHeader eyebrow="Recipient access" title={meta.fileName} description="Review the security policy, then verify to decrypt locally." />
            <div className="mt-6 grid gap-3 text-sm text-mist-300 sm:grid-cols-2">
              <Info label="Size" value={formatBytes(meta.sizeBytes)} />
              <Info label="Availability" value={<Countdown expiresAt={meta.expiresAt} />} />
              <Info label="Downloads" value={`${meta.downloadCount} / ${meta.maxDownloads} used`} />
              <Info label="Status" value="Ready for verification" />
            </div>
            <div className="mt-6">
              <SecurityFlags passwordEnabled={meta.passwordEnabled} otpEnabled={meta.otpEnabled} />
            </div>
            {!meta.passwordEnabled && !dekFragment ? (
              <p className="mt-4 text-sm text-amber-200">
                This drop is not password-wrapped and the decryption key fragment is missing from the URL.
              </p>
            ) : null}
            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
            <div className="mt-8">
              <Button className="w-full sm:w-auto" loading={busy} disabled={busy} onClick={() => void continueFromOverview()}>
                {meta.passwordEnabled ? 'Continue to password' : meta.otpEnabled ? 'Send verification code' : 'Verify and download'}
              </Button>
            </div>
          </Card>
        ) : null}

        {gate === 'password' && meta ? (
          <Card className="p-6 sm:p-8">
            <CardHeader eyebrow="Password verification" title="Enter the file password" description="This password unwraps the encryption key. It is sent only to verify access, over TLS." />
            <div className="mt-8 space-y-5">
              <Field label="Password" error={error || undefined}>
                <Input type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setGate('overview')}>
                  Back
                </Button>
                <Button className="w-full sm:w-auto" loading={busy} disabled={busy || password.length < 8} onClick={() => void submitPassword()}>
                  Verify password
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {gate === 'otp' && meta ? (
          <Card className="p-6 sm:p-8">
            <CardHeader
              eyebrow="OTP verification"
              title="Enter the 6-digit code"
              description={otpHint ? `A code was sent to ${otpHint}. It expires in 10 minutes.` : 'A one-time code was emailed to the recipient.'}
            />
            <div className="mt-8 space-y-5">
              <OTPInput value={otp} onChange={setOtp} disabled={busy} error={Boolean(error)} />
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setGate('overview')}>
                  Back
                </Button>
                <Button className="w-full sm:w-auto" loading={busy} disabled={busy || otp.length !== 6} onClick={() => void submitOtp()}>
                  Verify code
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {gate === 'integrity' ? (
          <Card className="p-6 sm:p-8">
            <CardHeader eyebrow="Integrity verification" title="Checking the ciphertext" description="SHA-256 is computed in your browser and compared with the stored hash before decryption." />
            <div className="mt-10 space-y-6">
              <Progress value={progress} label={progressLabel} />
              <SecurityChecklist
                items={[
                  { label: 'Fetch ciphertext', state: progress >= 48 ? 'done' : 'processing' },
                  { label: 'Verify SHA-256', state: progress < 48 ? 'pending' : progress < 72 ? 'processing' : 'done' },
                  { label: 'Decrypt in browser', state: progress < 72 ? 'pending' : progress < 100 ? 'processing' : 'done' },
                ]}
              />
            </div>
          </Card>
        ) : null}

        {gate === 'success' && meta ? (
          <Card className="p-6 sm:p-8">
            <CardHeader
              eyebrow="Download complete"
              title="The file was decrypted on this device"
              description={`${meta.fileName} passed integrity verification and was saved locally. The server never saw the plaintext.`}
            />
            <div className="mt-8">
              <Button className="w-full sm:w-auto" onClick={() => navigate('/')}>
                Return home
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-mist-500">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}

function Blocked({
  icon,
  title,
  body,
  tone = 'bad',
}: {
  icon: typeof Hourglass;
  title: string;
  body: string;
  tone?: 'bad' | 'warn';
}) {
  return (
    <AppShell>
      <Card>
        <ErrorState icon={icon} title={title} body={body} tone={tone} />
      </Card>
    </AppShell>
  );
}
