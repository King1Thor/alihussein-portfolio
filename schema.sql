-- Run this once on your Postgres database (Supabase/Render/Neon SQL editor or psql).
create table if not exists pageviews(
  id bigserial primary key,
  path text, referrer text, country text, device text,
  visitor_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pv_created on pageviews(created_at);
create index if not exists idx_pv_path on pageviews(path);

create table if not exists visitors(
  id text primary key,
  email text, name text, picture text,
  is_admin boolean default false,
  first_seen timestamptz default now(),
  last_seen timestamptz default now()
);

create table if not exists messages(
  id bigserial primary key,
  name text, email text, body text,
  status text default 'new',
  created_at timestamptz default now()
);

create table if not exists guestbook(
  id bigserial primary key,
  visitor_email text, visitor_name text, body text,
  approved boolean default false,
  created_at timestamptz default now()
);

create table if not exists chat_logs(
  id bigserial primary key,
  question text, answer text, visitor_id text,
  created_at timestamptz default now()
);
