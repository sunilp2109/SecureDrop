import { Badge } from '../ui/Badge';

export function SecurityFlags({
  passwordEnabled,
  otpEnabled,
}: {
  passwordEnabled: boolean;
  otpEnabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone="accent">✓ Encrypted AES-256-GCM</Badge>
      <Badge tone="good">✓ SHA-256 verified</Badge>
      {passwordEnabled ? <Badge tone="warn">✓ Password protected</Badge> : <Badge>No password</Badge>}
      {otpEnabled ? <Badge tone="warn">✓ OTP required</Badge> : <Badge>No OTP</Badge>}
    </div>
  );
}
