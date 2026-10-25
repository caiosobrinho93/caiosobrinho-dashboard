-- =========================================================
-- Dashboard pessoal — schema inicial para Supabase (fase 2)
-- =========================================================
-- Execute no SQL Editor de um projeto Supabase novo.
-- Todas as tabelas são privadas por usuário via Row Level Security.
-- A chave pública do Supabase pode ser usada no frontend; a service_role
-- nunca deve ser exposta. A autorização real vem das políticas abaixo.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Perfil / preferências (uma linha por usuário)
-- ---------------------------------------------------------
create table if not exists public.dashboard_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null default 'Você'
    check (char_length(display_name) between 1 and 60),
  monthly_budget numeric(14, 2) not null default 0
    check (monthly_budget >= 0),
  accent text not null default 'azul'
    check (accent in ('azul', 'teal', 'roxo', 'laranja', 'verde')),
  demo_banner_dismissed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Tarefas
-- ---------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  notes text not null default '',
  priority text not null default 'media'
    check (priority in ('baixa', 'media', 'alta')),
  list text not null default 'Pessoal'
    check (list in ('Pessoal', 'Trabalho', 'Estudos', 'Casa')),
  due_date date,
  done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Lista de compras
-- ---------------------------------------------------------
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  quantity numeric(12, 3) not null default 1 check (quantity > 0),
  unit text not null default 'un'
    check (unit in ('un', 'kg', 'g', 'L', 'ml', 'cx', 'pct')),
  price numeric(12, 2) check (price is null or price >= 0),
  category text not null default 'Outros'
    check (category in ('Mercado', 'Farmácia', 'Casa', 'Outros')),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Finanças
-- ---------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null check (char_length(description) between 1 and 160),
  amount numeric(14, 2) not null check (amount >= 0),
  type text not null check (type in ('receita', 'despesa')),
  category text not null default 'Outros' check (char_length(category) between 1 and 60),
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Midiateca
-- ---------------------------------------------------------
create table if not exists public.media_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  url text not null check (url ~* '^https?://'),
  kind text not null default 'video' check (kind in ('video', 'musica')),
  tags text[] not null default '{}'::text[]
    check (cardinality(tags) <= 8),
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Metas
-- ---------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  target_amount numeric(16, 2) not null check (target_amount > 0),
  current_amount numeric(16, 2) not null default 0 check (current_amount >= 0),
  unit text not null default 'R$' check (char_length(unit) between 1 and 20),
  deadline date,
  color text not null default '#569cd6'
    check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Notas
-- ---------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  body text not null default '',
  color text not null default '#dcdcaa'
    check (color ~ '^#[0-9a-fA-F]{6}$'),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Índices para as consultas do dashboard
-- ---------------------------------------------------------
create index if not exists tasks_user_due_idx
  on public.tasks (user_id, done, due_date);
create index if not exists shopping_user_done_idx
  on public.shopping_items (user_id, done);
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);
create index if not exists media_user_kind_idx
  on public.media_links (user_id, kind);
create index if not exists media_user_favorite_idx
  on public.media_links (user_id, favorite);
create index if not exists goals_user_created_idx
  on public.goals (user_id, created_at desc);
create index if not exists notes_user_pinned_updated_idx
  on public.notes (user_id, pinned desc, updated_at desc);

-- ---------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dashboard_settings_set_updated_at on public.dashboard_settings;
create trigger dashboard_settings_set_updated_at
  before update on public.dashboard_settings
  for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists shopping_items_set_updated_at on public.shopping_items;
create trigger shopping_items_set_updated_at
  before update on public.shopping_items
  for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists media_links_set_updated_at on public.media_links;
create trigger media_links_set_updated_at
  before update on public.media_links
  for each row execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Perfil criado automaticamente no primeiro cadastro
-- ---------------------------------------------------------
create or replace function public.handle_new_dashboard_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.dashboard_settings (user_id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Você'
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_dashboard on auth.users;
create trigger on_auth_user_created_dashboard
  after insert on auth.users
  for each row execute function public.handle_new_dashboard_user();

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
alter table public.dashboard_settings enable row level security;
alter table public.tasks enable row level security;
alter table public.shopping_items enable row level security;
alter table public.transactions enable row level security;
alter table public.media_links enable row level security;
alter table public.goals enable row level security;
alter table public.notes enable row level security;

drop policy if exists "settings_own_rows" on public.dashboard_settings;
create policy "settings_own_rows"
  on public.dashboard_settings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tasks_own_rows" on public.tasks;
create policy "tasks_own_rows"
  on public.tasks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "shopping_own_rows" on public.shopping_items;
create policy "shopping_own_rows"
  on public.shopping_items
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "transactions_own_rows" on public.transactions;
create policy "transactions_own_rows"
  on public.transactions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "media_own_rows" on public.media_links;
create policy "media_own_rows"
  on public.media_links
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "goals_own_rows" on public.goals;
create policy "goals_own_rows"
  on public.goals
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notes_own_rows" on public.notes;
create policy "notes_own_rows"
  on public.notes
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------
-- Privilégios explícitos (RLS continua sendo a barreira)
-- ---------------------------------------------------------
grant usage on schema public to authenticated;

revoke all on public.dashboard_settings from anon;
revoke all on public.tasks from anon;
revoke all on public.shopping_items from anon;
revoke all on public.transactions from anon;
revoke all on public.media_links from anon;
revoke all on public.goals from anon;
revoke all on public.notes from anon;

grant select, insert, update, delete on public.dashboard_settings to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.shopping_items to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.media_links to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.notes to authenticated;

comment on table public.dashboard_settings is
  'Preferências de exibição e orçamento de cada usuário do dashboard.';
comment on table public.tasks is
  'Tarefas pessoais, com prioridade, lista e prazo opcional.';
comment on table public.shopping_items is
  'Itens da lista de compras, com quantidade, unidade e preço opcional.';
comment on table public.transactions is
  'Receitas e despesas usadas nos gráficos e no orçamento mensal.';
comment on table public.media_links is
  'Links de vídeos e músicas salvos, com tags e favorito.';
comment on table public.goals is
  'Metas com valor-alvo, progresso, unidade, prazo e cor.';
comment on table public.notes is
  'Notas livres, com cor e fixação no topo.';
