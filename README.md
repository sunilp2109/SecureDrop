# SecureDrop

**Share files. Leave no trace.**

SecureDrop is a privacy-focused, anonymous file-sharing web app. A sender can encrypt a file in the browser, email a temporary access link to a recipient, and let the recipient verify and decrypt the file locally — without creating user accounts.

The server never sees plaintext files. Encryption keys are not sent in email.

> Secure by design, simple by default.

---

## Overview

### What it does

1. Sender uploads a file in the browser  
2. Sender enters the recipient email and security settings  
3. The file is encrypted client-side with **AES-256-GCM**  
4. A **SHA-256** integrity hash is generated  
5. Ciphertext is stored; a short-lived access token is created  
6. The recipient receives an email with an **Open Secure File** button (not the file)  
7. Recipient opens the link, completes password/OTP checks if enabled  
8. Integrity is verified, then the file is decrypted in the browser and downloaded  
9. The drop expires, hits its download limit, or is revoked — then ciphertext is deleted  

### Security features

- Client-side AES-256-GCM encryption  
- SHA-256 integrity verification  
- Anonymous sharing (no accounts)  
- Cryptographically random access and manage tokens (stored as hashes)  
- Optional password protection (key wrapping + server-side gate)  
- Optional email OTP  
- Expiration timers and download limits (enforced on the server)  
- Access revocation  
- Rate limiting on sensitive endpoints  
- Short-lived download grants  

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Lucide |
| Backend | Node.js, Express |
| Database | Supabase Postgres (`DATABASE_URL`) or local JSON |
| File storage | Supabase Storage (with service role key) or local disk |
| Email | SMTP via Nodemailer, or local HTML outbox |

---

## Repository layout

```text
SecureDrop/
├── client/                 React frontend (port 5173)
├── server/                 Express API (port 3001)
├── supabase/migrations/    SQL schema for shares + storage bucket
├── .env.example            Environment template (copy this)
└── package.json            npm workspaces
```

---

## Prerequisites

- **Node.js 20+** and npm  
- Git  
- Optional: a [Supabase](https://supabase.com) project  
- Optional: an SMTP mailbox (Gmail App Password, SendGrid, etc.) for real email  

You can run the app with **no** Supabase and **no** SMTP. In that case:

- Share metadata and encrypted files are stored under `server/data/`  
- Emails are written as HTML files in `server/data/outbox/`  

---

## Setup after cloning from GitHub

### 1. Clone and install

```bash
git clone <your-repo-url>
cd SecureDrop
npm install
```

### 2. Create environment file

Copy the example env file to `.env` in the **project root**.

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Open `.env` and keep the local defaults unless you are adding SMTP or Supabase:

```env
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:5173
VITE_API_URL=
```

Leave `VITE_API_URL` empty in local development. The Vite dev server proxies `/api` to the Express API.

**Never commit `.env`.** Secrets belong only in environment variables.

### 3. (Optional) Configure email

To send real recipient and OTP emails, set SMTP values in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-address@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=SecureDrop <your-address@gmail.com>
```

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your normal login password.

If SMTP is left blank, messages are saved to `server/data/outbox/` and the UI will not pretend they were delivered.

### 4. (Optional) Configure Supabase

To persist share metadata in Postgres:

1. Create a Supabase project.  
2. Set in `.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
SUPABASE_STORAGE_BUCKET=securedrop
```

3. Apply the schema:

```bash
node server/scripts/migrate.mjs
node server/scripts/migrate-extras.mjs
```

Or paste `supabase/migrations/001_init.sql` into the Supabase SQL editor.

To also store encrypted blobs in Supabase Storage, add the **service_role** key (Project Settings → API):

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Without that key, ciphertext stays on local disk even if Postgres is connected.

### 5. Run the app

From the project root:

```bash
npm run dev
```

This starts both processes:

| Service | URL |
| --- | --- |
| Web app | http://localhost:5173 |
| API health | http://localhost:3001/api/health |

Open **http://localhost:5173** and send a secure file.

Health check example:

```json
{
  "ok": true,
  "database": "supabase",
  "storage": "local",
  "email": "smtp"
}
```

`database` is `local` or `supabase`. `storage` is `local` until the service role key is set. `email` is `smtp` or `outbox`.

### 6. Run client or API separately (optional)

```bash
npm run dev:client
npm run dev:server
```

---

## How a drop is secured

- **Password enabled:** the data encryption key is wrapped with a password-derived key (PBKDF2) in the browser. The server stores only ciphertext and the wrapped key. Share the password out of band.  
- **No password:** the encryption key stays in the URL fragment (`#k=...`). Fragments are not sent to the server. The emailed link does **not** include this fragment.  
- Email contains the access path, file name, size, expiry, and security flags — never the file, DEK, or password.  
- Access, manage, and download-grant tokens are stored as SHA-256 hashes.  

---

## Main routes

| Path | Screen |
| --- | --- |
| `/` | Landing |
| `/send` | Upload, policy, encrypt, link, email |
| `/security` | How it works |
| `/security/email` | Recipient email preview |
| `/access/:token` | Recipient verification and download |
| `/dashboard` | Sender drops stored in this browser |
| `/dashboard/:manageToken` | File security details, QR, revoke, resend |

---

## npm scripts

| Command | Description |
| --- | --- |
| `npm install` | Install client, server, and root workspaces |
| `npm run dev` | Run API + web together |
| `npm run build` | Build client and server |
| `npm run start` | Start the compiled API (`server/dist`) |

---

## Production notes

1. Serve the app over **HTTPS**.  
2. Set `APP_URL` to the public frontend origin (used in emails and CORS).  
3. Point `VITE_API_URL` at the public API origin when the UI is not proxied to `/api`.  
4. Use Supabase Postgres + Storage with the service role key **only on the server**.  
5. Configure real SMTP.  
6. Keep `.env` out of version control. Rotate any secret that was ever pasted into chat or committed.  

---

## License

Private project — update this section if you publish the repository.
