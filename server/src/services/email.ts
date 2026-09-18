import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { config, usingSmtp } from '../config.ts';

type Mail = { to: string; subject: string; text: string; html: string };

function transporter() {
  if (!config.smtpHost) return null;
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser && config.smtpPass ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
  });
}

export async function sendMail(mail: Mail): Promise<{ delivered: boolean; outboxPath?: string }> {
  if (usingSmtp) {
    const tx = transporter();
    if (!tx) throw new Error('smtp_unconfigured');
    await tx.sendMail({
      from: config.smtpFrom,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { delivered: true };
  }

  const dir = path.join(config.dataDir, 'outbox');
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(':', '-');
  const outboxPath = path.join(dir, `${stamp}-${mail.to.replaceAll(/[^a-z0-9@._-]/gi, '_')}.html`);
  await writeFile(
    outboxPath,
    `<!-- to: ${mail.to} -->\n<!-- subject: ${mail.subject} -->\n${mail.html}`,
    'utf8',
  );
  return { delivered: false, outboxPath };
}
