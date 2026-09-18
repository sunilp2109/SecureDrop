export type AccessEmailInput = {
  recipientEmail: string;
  fileName: string;
  fileSizeLabel: string;
  expiresAtLabel: string;
  maxDownloads: number;
  passwordEnabled: boolean;
  otpEnabled: boolean;
  accessUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function accessEmail(input: AccessEmailInput): { subject: string; text: string; html: string } {
  const fileName = escapeHtml(input.fileName);
  const protections = [
    'AES-256-GCM encryption',
    'SHA-256 integrity verification',
    input.passwordEnabled ? 'Password protection' : null,
    input.otpEnabled ? 'OTP verification' : null,
    `${input.maxDownloads} download${input.maxDownloads === 1 ? '' : 's'} maximum`,
    `Expires ${escapeHtml(input.expiresAtLabel)}`,
  ].filter(Boolean);

  const subject = `A secure file is waiting for you: ${input.fileName}`;
  const text = [
    'You have received a file through SecureDrop.',
    '',
    `File: ${input.fileName}`,
    `Size: ${input.fileSizeLabel}`,
    `Expires: ${input.expiresAtLabel}`,
    `Download limit: ${input.maxDownloads}`,
    input.passwordEnabled ? 'Password protection is enabled.' : '',
    input.otpEnabled ? 'OTP verification is enabled.' : '',
    '',
    'Open the secure file (this link does not include the encryption key):',
    input.accessUrl,
    '',
    'If you were not expecting this file, ignore this email. The link will expire automatically.',
  ]
    .filter((line) => line !== '')
    .join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#070A0F;color:#E8EEF6;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070A0F;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#111820;border:1px solid rgba(148,163,184,0.14);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 12px;">
                <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#2DD4BF;">SecureDrop</p>
                <h1 style="margin:12px 0 0;font-size:24px;line-height:1.3;font-weight:600;color:#F4F7FB;">A secure file is waiting for you</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px;color:#8B9BB0;font-size:14px;line-height:1.6;">
                Someone sent you an encrypted file. The file itself is not attached to this email.
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <table role="presentation" width="100%" style="background:#0B1017;border:1px solid rgba(148,163,184,0.12);border-radius:14px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#6B7C91;text-transform:uppercase;letter-spacing:0.08em;">File</p>
                      <p style="margin:0 0 14px;font-size:16px;color:#E8EEF6;">${fileName}</p>
                      <p style="margin:0;font-size:13px;color:#8B9BB0;">${escapeHtml(input.fileSizeLabel)} · Expires ${escapeHtml(input.expiresAtLabel)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <p style="margin:0 0 10px;font-size:12px;color:#6B7C91;text-transform:uppercase;letter-spacing:0.08em;">Security</p>
                <p style="margin:0;font-size:13px;line-height:1.7;color:#B4C2D4;">${protections.join('<br/>')}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;" align="left">
                <a href="${escapeHtml(input.accessUrl)}" style="display:inline-block;background:#2DD4BF;color:#06201C;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;">Open Secure File</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;font-size:12px;line-height:1.6;color:#6B7C91;">
                This message does not contain encryption keys, passwords, or the file itself. If you were not expecting this, you can ignore it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export function otpEmail(recipientEmail: string, otp: string, fileName: string): { subject: string; text: string; html: string } {
  const subject = 'Your SecureDrop verification code';
  const text = `Your one-time code for ${fileName} is ${otp}. It expires in 10 minutes. If you did not request this, ignore the message.`;
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#070A0F;color:#E8EEF6;font-family:Arial,sans-serif;">
    <table role="presentation" width="480" style="margin:0 auto;background:#111820;border:1px solid rgba(148,163,184,0.14);border-radius:18px;padding:28px;">
      <tr><td>
        <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#2DD4BF;">SecureDrop</p>
        <h1 style="margin:12px 0 16px;font-size:22px;">Verification code</h1>
        <p style="margin:0 0 20px;color:#8B9BB0;font-size:14px;">Use this code to open <strong style="color:#E8EEF6;">${escapeHtml(fileName)}</strong>. It expires in 10 minutes.</p>
        <p style="margin:0;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#F4F7FB;">${escapeHtml(otp)}</p>
        <p style="margin:20px 0 0;color:#6B7C91;font-size:12px;">Sent to ${escapeHtml(recipientEmail)}. SecureDrop never includes this code in the original file link.</p>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject, text, html };
}
