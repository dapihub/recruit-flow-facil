-- ══════════════════════════════════════════════════════════════
-- THEMIS — Schema inicial
-- Supabase / PostgreSQL · multi-tenant via RLS
-- ══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUMS ───────────────────────────────────────────────────
CREATE TYPE plan_type        AS ENUM ('free','starter','professional','enterprise');
CREATE TYPE user_role        AS ENUM ('admin','recruiter','financial','viewer');
CREATE TYPE job_status       AS ENUM ('open','screening','interviewing','proposal','closed','cancelled','paused');
CREATE TYPE priority_level   AS ENUM ('low','medium','high','urgent');
CREATE TYPE contract_type    AS ENUM ('clt','pj','internship','temporary','freelance');
CREATE TYPE work_model       AS ENUM ('onsite','hybrid','remote');
CREATE TYPE seniority_level  AS ENUM ('intern','junior','mid','senior','specialist','lead');
CREATE TYPE fee_model        AS ENUM ('salary_pct','fixed','fixed_plus_success');
CREATE TYPE task_status      AS ENUM ('not_started','in_progress','in_review','done');
CREATE TYPE meeting_type     AS ENUM ('call','video_call','in_person','other');
CREATE TYPE meeting_status   AS ENUM ('scheduled','completed','cancelled','rescheduled');
CREATE TYPE crm_outcome      AS ENUM ('won','lost');
CREATE TYPE transaction_type AS ENUM ('income','expense');
CREATE TYPE payment_status   AS ENUM ('pending','paid','overdue','cancelled');
CREATE TYPE payroll_type     AS ENUM ('salary','commission','bonus','other');
CREATE TYPE person_type      AS ENUM ('pf','pj');
CREATE TYPE notification_type AS ENUM (
  'job_created','job_status_changed','job_stale','sla_warning',
  'task_assigned','task_due','meeting_scheduled',
  'payment_due','opportunity_stale'
);

-- ─── FUNÇÕES BASE ────────────────────────────────────────────
-- plpgsql: corpo não é validado na criação, só na execução
-- Permite definir antes das tabelas referenciadas.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN (SELECT company_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- COMPANIES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.companies (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  cnpj       text,
  email      text,
  phone      text,
  website    text,
  city       text,
  state      text,
  logo_url   text,
  plan       plan_type NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_insert"     ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "companies_select_own" ON public.companies FOR SELECT USING (id = current_company_id());
CREATE POLICY "companies_update_own" ON public.companies FOR UPDATE
  USING (id = current_company_id()) WITH CHECK (id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- PROFILES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL DEFAULT '',
  email      text NOT NULL DEFAULT '',
  avatar_url text,
  role       user_role NOT NULL DEFAULT 'recruiter',
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_company_id_idx ON public.profiles(company_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own"                  ON public.profiles FOR ALL
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_company_select"       ON public.profiles FOR SELECT
  USING (company_id = current_company_id());
CREATE POLICY "profiles_company_admin_update" ON public.profiles FOR UPDATE
  USING (company_id = current_company_id() AND current_user_role() = 'admin');
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- INVITES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.invites (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        user_role NOT NULL DEFAULT 'recruiter',
  token       text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  expires_at  timestamptz NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_company"     ON public.invites FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "invites_public_read" ON public.invites FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════
-- CLIENTS & CONTACTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.clients (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  person_type person_type NOT NULL DEFAULT 'pj',
  cnpj        text,
  email       text,
  phone       text,
  website     text,
  street      text,
  city        text,
  state       text,
  zip_code    text,
  country     text DEFAULT 'Brasil',
  notes       text,
  is_active   boolean NOT NULL DEFAULT true,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clients_company_id_idx ON public.clients(company_id);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_company" ON public.clients FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contacts (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id  uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  name       text NOT NULL,
  email      text,
  phone      text,
  role       text,
  avatar_url text,
  linkedin   text,
  notes      text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contacts_company_id_idx ON public.contacts(company_id);
CREATE INDEX contacts_client_id_idx  ON public.contacts(client_id);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_company" ON public.contacts FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- JOBS (Vagas)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.jobs (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id        uuid REFERENCES public.clients(id)            ON DELETE SET NULL,
  recruiter_id     uuid REFERENCES public.profiles(id)           ON DELETE SET NULL,
  title            text NOT NULL,
  description      text,
  status           job_status      NOT NULL DEFAULT 'open',
  priority         priority_level  NOT NULL DEFAULT 'medium',
  contract_type    contract_type,
  work_model       work_model,
  seniority        seniority_level,
  department       text,
  location         text,
  headcount        int NOT NULL DEFAULT 1,
  salary_min       numeric(12,2),
  salary_max       numeric(12,2),
  benefits         text,
  fee_model        fee_model,
  fee_value        numeric(12,2),
  is_exclusive     boolean NOT NULL DEFAULT false,
  required_skills  text,
  desired_skills   text,
  responsibilities text,
  opened_at        timestamptz NOT NULL DEFAULT now(),
  deadline         timestamptz,
  closed_at        timestamptz,
  deleted_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_company_id_status_idx ON public.jobs(company_id, status);
CREATE INDEX jobs_client_id_idx         ON public.jobs(client_id);
CREATE INDEX jobs_recruiter_id_idx      ON public.jobs(recruiter_id);
CREATE INDEX jobs_deadline_idx          ON public.jobs(company_id, deadline) WHERE deleted_at IS NULL;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_company" ON public.jobs FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- TASKS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.tasks (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id       uuid REFERENCES public.jobs(id)               ON DELETE SET NULL,
  assignee_id  uuid REFERENCES public.profiles(id)           ON DELETE SET NULL,
  title        text NOT NULL,
  description  text,
  status       task_status    NOT NULL DEFAULT 'not_started',
  priority     priority_level NOT NULL DEFAULT 'medium',
  start_date   timestamptz,
  due_date     timestamptz,
  completed_at timestamptz,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tasks_company_id_status_idx    ON public.tasks(company_id, status);
CREATE INDEX tasks_assignee_id_due_date_idx ON public.tasks(assignee_id, due_date);
CREATE INDEX tasks_job_id_idx               ON public.tasks(job_id);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_company" ON public.tasks FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- MEETINGS (Reuniões / Atas)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.meetings (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id    uuid REFERENCES public.clients(id)            ON DELETE SET NULL,
  title        text NOT NULL,
  type         meeting_type   NOT NULL DEFAULT 'other',
  status       meeting_status NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz NOT NULL,
  duration_min int,
  location     text,
  video_link   text,
  agenda       text,
  notes        text,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meetings_company_id_scheduled_idx ON public.meetings(company_id, scheduled_at);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meetings_company" ON public.meetings FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- CRM
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.crm_stages (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#6366f1',
  "order"     int  NOT NULL DEFAULT 0,
  probability int  NOT NULL DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  is_final    boolean NOT NULL DEFAULT false,
  outcome     crm_outcome,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_stages_company_order_idx ON public.crm_stages(company_id, "order");
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_stages_company" ON public.crm_stages FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.crm_opportunities (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stage_id       uuid NOT NULL REFERENCES public.crm_stages(id),
  client_id      uuid REFERENCES public.clients(id)            ON DELETE SET NULL,
  contact_id     uuid REFERENCES public.contacts(id)           ON DELETE SET NULL,
  assignee_id    uuid REFERENCES public.profiles(id)           ON DELETE SET NULL,
  title          text NOT NULL,
  value          numeric(12,2),
  probability    int  NOT NULL DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  expected_close date,
  lead_name      text,
  lead_email     text,
  notes          text,
  lost_reason    text,
  deleted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_opp_company_stage_idx ON public.crm_opportunities(company_id, stage_id);
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_opp_company" ON public.crm_opportunities FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- FINANCEIRO
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.categories (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       transaction_type NOT NULL,
  color      text NOT NULL DEFAULT '#6366f1',
  is_default boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name, type)
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_company" ON public.categories FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.transactions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES public.clients(id)            ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id)         ON DELETE SET NULL,
  type        transaction_type NOT NULL,
  description text NOT NULL,
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  date        date NOT NULL,
  due_date    date,
  paid_at     timestamptz,
  status      payment_status NOT NULL DEFAULT 'pending',
  notes       text,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_company_type_status_idx ON public.transactions(company_id, type, status);
CREATE INDEX transactions_date_idx                ON public.transactions(company_id, date);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_company" ON public.transactions FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payroll_entries (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  person_name     text NOT NULL,
  role            text,
  type            payroll_type NOT NULL DEFAULT 'salary',
  amount          numeric(12,2) NOT NULL CHECK (amount >= 0),
  reference_month date NOT NULL,
  payment_date    date,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  notes           text,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payroll_company_month_idx ON public.payroll_entries(company_id, reference_month);
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_company" ON public.payroll_entries FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payroll_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- CLIENT RATINGS (Ranking)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.client_ratings (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id         uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id          uuid NOT NULL REFERENCES public.clients(id)   ON DELETE CASCADE,
  evaluator_id       uuid REFERENCES public.profiles(id)           ON DELETE SET NULL,
  evaluated_at       timestamptz NOT NULL DEFAULT now(),
  payment_timeliness int NOT NULL DEFAULT 5 CHECK (payment_timeliness  BETWEEN 1 AND 10),
  briefing_clarity   int NOT NULL DEFAULT 5 CHECK (briefing_clarity    BETWEEN 1 AND 10),
  feedback_agility   int NOT NULL DEFAULT 5 CHECK (feedback_agility    BETWEEN 1 AND 10),
  volume_potential   int NOT NULL DEFAULT 5 CHECK (volume_potential    BETWEEN 1 AND 10),
  referral_potential int NOT NULL DEFAULT 5 CHECK (referral_potential  BETWEEN 1 AND 10),
  overall_score      numeric(4,2) GENERATED ALWAYS AS (
    (payment_timeliness + briefing_clarity + feedback_agility + volume_potential + referral_potential)::numeric / 5
  ) STORED,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX client_ratings_company_client_idx ON public.client_ratings(company_id, client_id);
ALTER TABLE public.client_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_ratings_company" ON public.client_ratings FOR ALL
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.client_ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS & MENU FAVORITES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      text NOT NULL,
  body       text,
  url        text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_is_read_idx ON public.notifications(user_id, is_read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.menu_favorites (
  id      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path    text NOT NULL,
  label   text NOT NULL,
  "order" int  NOT NULL DEFAULT 0,
  UNIQUE (user_id, path)
);
ALTER TABLE public.menu_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_favorites_own" ON public.menu_favorites FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- TRIGGER: auto-create profile on signup
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, company_id, name, email, role)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'company_id', '')::uuid,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', '')::user_role, 'recruiter')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════════════
-- SEED: defaults para nova empresa (chamado pelo onboarding)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.seed_company_defaults(p_company_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.crm_stages (company_id, name, color, "order", probability) VALUES
    (p_company_id, 'Prospecção',    '#6366f1', 1, 10),
    (p_company_id, 'Contato Feito', '#8b5cf6', 2, 25),
    (p_company_id, 'Proposta',      '#f59e0b', 3, 50),
    (p_company_id, 'Negociação',    '#f97316', 4, 75),
    (p_company_id, 'Contrato',      '#10b981', 5, 100);

  UPDATE public.crm_stages
    SET is_final = true, outcome = 'won'
    WHERE company_id = p_company_id AND "order" = 5;

  INSERT INTO public.categories (company_id, name, type, color, is_default) VALUES
    (p_company_id, 'Fee de Recrutamento',  'income',  '#10b981', true),
    (p_company_id, 'Fee de Sucesso',       'income',  '#06b6d4', true),
    (p_company_id, 'Reembolso',            'income',  '#6366f1', true),
    (p_company_id, 'Salários',             'expense', '#ef4444', true),
    (p_company_id, 'Comissões',            'expense', '#f97316', true),
    (p_company_id, 'Software/Ferramentas', 'expense', '#8b5cf6', true),
    (p_company_id, 'Marketing',            'expense', '#ec4899', true),
    (p_company_id, 'Administrativo',       'expense', '#94a3b8', true);
END;
$$;
