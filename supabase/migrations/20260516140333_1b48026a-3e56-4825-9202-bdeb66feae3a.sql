create type public.vaga_status as enum ('Aberta', 'Em processo', 'Fechada', 'Encerrada');
create type public.pipeline_etapa as enum ('Briefing', 'Contrato', 'Descritivo publicado', 'Candidatos em triagem', 'Finalizada');
create type public.regime_trabalho as enum ('CLT', 'PJ', 'Híbrido');
create type public.candidato_status as enum ('Triagem', 'Entrevista', 'Contratado', 'Reprovado');
create type public.fatura_status as enum ('Pago', 'Pendente', 'Atrasado');
create type public.custo_categoria as enum ('Pessoal', 'Software', 'Marketing', 'Anúncios', 'Infraestrutura', 'Impostos', 'Operacional', 'Outros');
create type public.custo_tipo as enum ('Fixo', 'Variável');
create type public.custo_status as enum ('Pago', 'Pendente', 'Atrasado');

create sequence public.fatura_numero_seq start 1;

create or replace function public.generate_fatura_numero()
returns text
language plpgsql
set search_path = public
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.fatura_numero_seq');
  return 'RF-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 3, '0');
end;
$$;

create table public.vagas (
  id uuid primary key default gen_random_uuid(),
  cargo text not null,
  empresa text not null,
  area text not null,
  prazo date not null,
  status public.vaga_status not null default 'Aberta',
  descricao text,
  salario text,
  regime public.regime_trabalho,
  etapa public.pipeline_etapa not null default 'Briefing',
  briefing jsonb,
  descritivo jsonb,
  contrato jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  telefone text,
  vaga_id uuid references public.vagas(id) on delete set null,
  vaga_nome text not null default '',
  etapa text not null default 'Triagem inicial',
  proxima_acao text not null default 'Análise CV',
  pontuacao numeric(4,1) not null default 0,
  status public.candidato_status not null default 'Triagem',
  linkedin text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faturas (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default public.generate_fatura_numero(),
  cliente text not null,
  servico text not null,
  vencimento date not null,
  valor numeric(12,2) not null,
  status public.fatura_status not null default 'Pendente',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.custos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria public.custo_categoria not null,
  tipo public.custo_tipo not null,
  valor numeric(12,2) not null,
  data date not null,
  status public.custo_status not null default 'Pendente',
  fornecedor text,
  vaga_id uuid references public.vagas(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_candidatos_vaga_id on public.candidatos(vaga_id);
create index idx_custos_vaga_id on public.custos(vaga_id);
create index idx_vagas_status on public.vagas(status);
create index idx_faturas_vencimento on public.faturas(vencimento);
create index idx_custos_data on public.custos(data);

alter table public.vagas enable row level security;
alter table public.candidatos enable row level security;
alter table public.faturas enable row level security;
alter table public.custos enable row level security;

create policy "Authenticated users can view all vagas"
on public.vagas
for select
to authenticated
using (true);

create policy "Authenticated users can create vagas"
on public.vagas
for insert
to authenticated
with check (true);

create policy "Authenticated users can update vagas"
on public.vagas
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete vagas"
on public.vagas
for delete
to authenticated
using (true);

create policy "Authenticated users can view all candidatos"
on public.candidatos
for select
to authenticated
using (true);

create policy "Authenticated users can create candidatos"
on public.candidatos
for insert
to authenticated
with check (true);

create policy "Authenticated users can update candidatos"
on public.candidatos
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete candidatos"
on public.candidatos
for delete
to authenticated
using (true);

create policy "Authenticated users can view all faturas"
on public.faturas
for select
to authenticated
using (true);

create policy "Authenticated users can create faturas"
on public.faturas
for insert
to authenticated
with check (true);

create policy "Authenticated users can update faturas"
on public.faturas
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete faturas"
on public.faturas
for delete
to authenticated
using (true);

create policy "Authenticated users can view all custos"
on public.custos
for select
to authenticated
using (true);

create policy "Authenticated users can create custos"
on public.custos
for insert
to authenticated
with check (true);

create policy "Authenticated users can update custos"
on public.custos
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete custos"
on public.custos
for delete
to authenticated
using (true);

create trigger set_vagas_updated_at
before update on public.vagas
for each row
execute function public.set_updated_at();

create trigger set_candidatos_updated_at
before update on public.candidatos
for each row
execute function public.set_updated_at();

create trigger set_faturas_updated_at
before update on public.faturas
for each row
execute function public.set_updated_at();

create trigger set_custos_updated_at
before update on public.custos
for each row
execute function public.set_updated_at();