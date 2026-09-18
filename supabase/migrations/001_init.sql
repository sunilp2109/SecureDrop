-- Enable when using Supabase. The API uses the service role and never exposes this table to the browser.

create extension if not exists pgcrypto;

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  access_token_hash text not null unique,
  manage_token_hash text not null unique,
  recipient_email text not null,
  original_filename text not null,
  mime_type text,
  size_bytes bigint not null check (size_bytes > 0),
  storage_path text not null,
  ciphertext_sha256 text not null,
  iv text not null,
  wrapped_dek text,
  kdf_salt text,
  kdf_iterations integer,
  password_enabled boolean not null default false,
  password_salt text,
  password_hash text,
  otp_enabled boolean not null default false,
  otp_hash text,
  otp_salt text,
  otp_expires_at timestamptz,
  otp_attempts integer not null default 0,
  max_downloads integer not null default 1 check (max_downloads > 0),
  download_count integer not null default 0,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  download_grant_hash text,
  download_grant_expires_at timestamptz,
  password_verified_until timestamptz,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz
);

create index if not exists idx_shares_expires_at on public.shares (expires_at);
create index if not exists idx_shares_access_token_hash on public.shares (access_token_hash);
create index if not exists idx_shares_manage_token_hash on public.shares (manage_token_hash);

alter table public.shares enable row level security;

-- No anon/authenticated policies: only the service role (backend) can read or write.

insert into storage.buckets (id, name, public)
values ('securedrop', 'securedrop', false)
on conflict (id) do nothing;
