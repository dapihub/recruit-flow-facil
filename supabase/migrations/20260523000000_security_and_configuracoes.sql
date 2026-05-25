-- =============================================================
-- MIGRAÇÃO DE SEGURANÇA — 2026-05-23
-- 1. Cria tabela configuracoes (dados da empresa)
-- 2. Adiciona user_id em todas as tabelas de negócio
-- 3. Faz backfill do user_id com o único usuário existente
-- 4. Substitui RLS policies permissivas por isolamento por usuário
-- =============================================================

-- ─── 1. TABELA DE CONFIGURAÇÕES ──────────────────────────────

create table if not exists public.configuracoes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  razao_social          text not null default '',
  cnpj                  text not null default '',
  endereco              text not null default '',
  telefone              text not null default '',
  email                 text not null default '',
  representante         text not null default '',
  chave_pix             text not null default '',
  foro                  text not null default '',
  local_assinatura      text not null default '',
  prazo_garantia_padrao text not null default '90 (noventa) dias corridos',
  max_reposicoes_padrao text not null default '3 (três) reposições',
  prazo_escolha_padrao  text not null default '30 (trinta) dias',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint configuracoes_one_per_user unique (user_id)
);

alter table public.configuracoes enable row level security;

create trigger set_configuracoes_updated_at
  before update on public.configuracoes
  for each row execute function public.set_updated_at();

create policy "Usuário vê própria configuração"
  on public.configuracoes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuário cria própria configuração"
  on public.configuracoes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuário atualiza própria configuração"
  on public.configuracoes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuário deleta própria configuração"
  on public.configuracoes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─── 2. ADICIONA user_id NAS TABELAS DE NEGÓCIO ──────────────

alter table public.vagas
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.candidatos
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.faturas
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.custos
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- ─── 3. BACKFILL: atribui todos os registros ao único usuário ─

do $$
declare
  v_user_id uuid;
begin
  -- Pega o único usuário existente no sistema
  select id into v_user_id from auth.users order by created_at limit 1;

  if v_user_id is null then
    raise notice 'Nenhum usuário encontrado — backfill ignorado.';
    return;
  end if;

  update public.vagas      set user_id = v_user_id where user_id is null;
  update public.candidatos set user_id = v_user_id where user_id is null;
  update public.faturas     set user_id = v_user_id where user_id is null;
  update public.custos      set user_id = v_user_id where user_id is null;

  raise notice 'Backfill concluído para user_id = %', v_user_id;
end;
$$;

-- ─── 4. TORNA user_id OBRIGATÓRIO ────────────────────────────

alter table public.vagas      alter column user_id set not null;
alter table public.candidatos alter column user_id set not null;
alter table public.faturas    alter column user_id set not null;
alter table public.custos     alter column user_id set not null;

-- ─── 5. ÍNDICES ──────────────────────────────────────────────

create index if not exists idx_vagas_user_id      on public.vagas(user_id);
create index if not exists idx_candidatos_user_id on public.candidatos(user_id);
create index if not exists idx_faturas_user_id    on public.faturas(user_id);
create index if not exists idx_custos_user_id     on public.custos(user_id);

-- ─── 6. REMOVE RLS POLICIES ANTIGAS ─────────────────────────

drop policy if exists "Authenticated users can view all vagas"    on public.vagas;
drop policy if exists "Authenticated users can create vagas"      on public.vagas;
drop policy if exists "Authenticated users can update vagas"      on public.vagas;
drop policy if exists "Authenticated users can delete vagas"      on public.vagas;

drop policy if exists "Authenticated users can view all candidatos"   on public.candidatos;
drop policy if exists "Authenticated users can create candidatos"     on public.candidatos;
drop policy if exists "Authenticated users can update candidatos"     on public.candidatos;
drop policy if exists "Authenticated users can delete candidatos"     on public.candidatos;

drop policy if exists "Authenticated users can view all faturas"  on public.faturas;
drop policy if exists "Authenticated users can create faturas"    on public.faturas;
drop policy if exists "Authenticated users can update faturas"    on public.faturas;
drop policy if exists "Authenticated users can delete faturas"    on public.faturas;

drop policy if exists "Authenticated users can view all custos"   on public.custos;
drop policy if exists "Authenticated users can create custos"     on public.custos;
drop policy if exists "Authenticated users can update custos"     on public.custos;
drop policy if exists "Authenticated users can delete custos"     on public.custos;

-- ─── 7. CRIA NOVAS RLS POLICIES (isolamento por usuário) ─────

-- vagas
create policy "Usuário vê próprias vagas"
  on public.vagas for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuário cria próprias vagas"
  on public.vagas for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Usuário atualiza próprias vagas"
  on public.vagas for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuário deleta próprias vagas"
  on public.vagas for delete to authenticated
  using (auth.uid() = user_id);

-- candidatos
create policy "Usuário vê próprios candidatos"
  on public.candidatos for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuário cria próprios candidatos"
  on public.candidatos for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Usuário atualiza próprios candidatos"
  on public.candidatos for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuário deleta próprios candidatos"
  on public.candidatos for delete to authenticated
  using (auth.uid() = user_id);

-- faturas
create policy "Usuário vê próprias faturas"
  on public.faturas for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuário cria próprias faturas"
  on public.faturas for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Usuário atualiza próprias faturas"
  on public.faturas for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuário deleta próprias faturas"
  on public.faturas for delete to authenticated
  using (auth.uid() = user_id);

-- custos
create policy "Usuário vê próprios custos"
  on public.custos for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuário cria próprios custos"
  on public.custos for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Usuário atualiza próprios custos"
  on public.custos for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuário deleta próprios custos"
  on public.custos for delete to authenticated
  using (auth.uid() = user_id);
