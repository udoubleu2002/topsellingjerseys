-- Top Selling Jerseys: accounts (saved My Jerseys lists) and newsletter sign-ups.
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste this file > Run.

-- One saved list per account. Each person can read and change only their own row.
create table if not exists public.jersey_lists (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '' check (length(display_name) <= 24),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 1000),
  wish jsonb not null default '[]'::jsonb check (jsonb_typeof(wish) = 'array' and jsonb_array_length(wish) <= 1000),
  updated_at timestamptz not null default now()
);

alter table public.jersey_lists enable row level security;

drop policy if exists "read own list" on public.jersey_lists;
create policy "read own list" on public.jersey_lists
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "add own list" on public.jersey_lists;
create policy "add own list" on public.jersey_lists
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "change own list" on public.jersey_lists;
create policy "change own list" on public.jersey_lists
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "delete own list" on public.jersey_lists;
create policy "delete own list" on public.jersey_lists
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Newsletter sign-ups. Visitors can add an address; nobody can read the list from the website.
-- You read it in the Supabase dashboard (Table Editor > newsletter_signups > Export to CSV).
create table if not exists public.newsletter_signups (
  id bigint generated always as identity primary key,
  email text not null unique check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source text check (length(source) <= 40),
  created_at timestamptz not null default now()
);

alter table public.newsletter_signups enable row level security;

drop policy if exists "anyone can sign up" on public.newsletter_signups;
create policy "anyone can sign up" on public.newsletter_signups
  for insert to anon, authenticated with check (true);
