import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileText, QrCode, ShieldBan } from 'lucide-react';
import QRCode from 'qrcode';
import { AppShell } from '../components/layout/AppShell';
import { Countdown } from '../components/security/Countdown';
import { SecurityFlags } from '../components/security/SecurityFlags';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { api, ApiError } from '../lib/api';
import { formatBytes, formatDateTime } from '../lib/format';
import { dropSession } from '../lib/session';
import type { ManagedShare, SavedDrop } from '../types';

export function DashboardPage() {
  const { manageToken } = useParams();
  const saved = dropSession.list();

  if (manageToken) {
    return <FileDetails manageToken={manageToken} local={dropSession.get(manageToken)} />;
  }

  return (
    <AppShell wide>
      <CardHeader
        eyebrow="Sender dashboard"
        title="Files you secured in this browser"
        description="Dashboard links use a manage token stored only on this device. The server never issues a list of your drops."
      />
      <div className="mt-8">
        {saved.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileText}
              title="No drops yet"
              body="Secure a file in this browser and it will appear here, with a private manage link stored only on this device."
              actionTo="/send"
              actionLabel="Send a secure file"
            />
          </Card>
        ) : (
          <div className="stagger grid gap-4">
            {saved.map((drop) => (
              <Card key={drop.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{drop.fileName}</p>
                  <p className="mt-1 text-xs text-mist-500">
                    To {drop.recipientEmail} · expires {formatDateTime(drop.expiresAt)}
                  </p>
                </div>
                <Link
                  to={`/dashboard/${drop.manageToken}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm text-mist-100 transition duration-180 hover:bg-white/5"
                >
                  View details
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FileDetails({ manageToken, local }: { manageToken: string; local?: SavedDrop }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [share, setShare] = useState<ManagedShare | null>(null);
  const [error, setError] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fullLink = useMemo(() => {
    if (!local) return '';
    return local.dekFragment ? `${local.accessUrl}#k=${local.dekFragment}` : local.accessUrl;
  }, [local]);

  useEffect(() => {
    let cancelled = false;
    api
      .manage(manageToken)
      .then((data) => {
        if (!cancelled) setShare(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Dashboard link is invalid.');
      });
    return () => {
      cancelled = true;
    };
  }, [manageToken]);

  async function revoke() {
    setBusy(true);
    try {
      await api.revoke(manageToken);
      const next = await api.manage(manageToken);
      setShare(next);
      toast('Access revoked', 'warn');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not revoke access.';
      setError(message);
      toast(message, 'bad');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!local?.accessToken) {
      const message = 'The original access token is not stored in this browser, so the email cannot be resent.';
      setError(message);
      toast(message, 'bad');
      return;
    }
    setBusy(true);
    try {
      const result = await api.resendEmail(manageToken, local.accessToken);
      toast(result.emailDelivered ? 'Email sent' : 'Email written to the local outbox.', result.emailDelivered ? 'good' : 'warn');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not resend email.';
      setError(message);
      toast(message, 'bad');
    } finally {
      setBusy(false);
    }
  }

  if (error && !share) {
    return (
      <AppShell>
        <Card className="p-8 text-sm text-red-300">{error}</Card>
      </AppShell>
    );
  }

  if (!share) {
    return (
      <AppShell>
        <Card className="p-8 text-sm text-mist-400">Loading security details…</Card>
      </AppShell>
    );
  }

  const tone = share.status === 'ok' ? 'good' : share.status === 'revoked' ? 'bad' : 'warn';
  const label = { ok: '✓ Active', expired: '✕ Expired', revoked: '✕ Revoked', limit: '✕ Limit reached' }[share.status];

  return (
    <AppShell>
      <Card className="animate-fade-up p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <CardHeader eyebrow="File security details" title={share.fileName} description={`Recipient ${share.recipientEmail}`} />
          <Badge tone={tone}>{label}</Badge>
        </div>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Size" value={formatBytes(share.sizeBytes)} />
          <Detail label="Created" value={formatDateTime(share.createdAt)} />
          <Detail label="Countdown" value={<Countdown expiresAt={share.expiresAt} />} />
          <Detail label="Downloads" value={`${share.downloadCount} / ${share.maxDownloads}`} />
        </div>
        <div className="mt-5">
          <SecurityFlags passwordEnabled={share.passwordEnabled} otpEnabled={share.otpEnabled} />
        </div>
        <p className="mt-5 break-all font-mono text-[11px] text-mist-500">SHA-256 {share.sha256}</p>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Button variant="danger" className="w-full sm:w-auto" loading={busy} disabled={share.status !== 'ok' || busy} onClick={() => void revoke()}>
            <ShieldBan className="h-4 w-4" />
            Revoke access
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={!fullLink}
            onClick={async () => setQr(await QRCode.toDataURL(fullLink, { margin: 1, width: 280, color: { dark: '#05070A', light: '#ECFDF5' } }))}
          >
            <QrCode className="h-4 w-4" />
            QR code
          </Button>
          <Button variant="ghost" className="w-full sm:w-auto" loading={busy} onClick={() => void resend()}>
            Resend email
          </Button>
          <Button variant="ghost" className="w-full sm:w-auto" onClick={() => navigate('/dashboard')}>
            All files
          </Button>
        </div>
      </Card>
      <Modal open={Boolean(qr)} title="QR code" onClose={() => setQr(null)}>
        {qr ? <img src={qr} alt="Secure access QR code" className="mx-auto rounded-xl" /> : null}
      </Modal>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-mist-500">{label}</p>
      <p className="mt-1 text-white">{value}</p>
    </div>
  );
}
