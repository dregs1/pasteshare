-- PasteShare: executar no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.pastes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  content text not null check (char_length(content) between 1 and 200000),
  language text not null default 'plaintext',
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  created_at timestamptz not null default now(),
  expires_at timestamptz null
);

create index if not exists pastes_user_created_idx on public.pastes(user_id, created_at desc);
create index if not exists pastes_expiry_idx on public.pastes(expires_at);

alter table public.pastes enable row level security;

-- Donos podem ler e gerir os próprios pastes.
drop policy if exists "Owners can read own pastes" on public.pastes;
create policy "Owners can read own pastes" on public.pastes
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Owners can create own pastes" on public.pastes;
create policy "Owners can create own pastes" on public.pastes
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Owners can update own pastes" on public.pastes;
create policy "Owners can update own pastes" on public.pastes
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Owners can delete own pastes" on public.pastes;
create policy "Owners can delete own pastes" on public.pastes
for delete to authenticated
using (auth.uid() = user_id);

-- Leitura de pastes públicos por qualquer visitante.
drop policy if exists "Anyone can read active public pastes" on public.pastes;
create policy "Anyone can read active public pastes" on public.pastes
for select to anon, authenticated
using (visibility = 'public' and (expires_at is null or expires_at > now()));

-- NOTA DE SEGURANÇA:
-- Os pastes "unlisted" e "private" não são expostos por uma política pública.
-- Nesta primeira versão, partilha por link funciona para pastes públicos.
-- A política de "unlisted" exigiria uma função RPC controlada ou token secreto
-- (UUID não deve ser tratado como autorização suficiente para conteúdo sensível).
-- "private" só é visível pelo proprietário autenticado.
-- Para apagar expirados automaticamente, configura um Cron Job no Supabase
-- (Database > Extensions: pg_cron) com:
-- delete from public.pastes where expires_at is not null and expires_at <= now();
