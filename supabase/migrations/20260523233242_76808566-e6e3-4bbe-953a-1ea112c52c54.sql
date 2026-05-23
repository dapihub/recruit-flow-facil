-- ============================================================
-- security_and_configuracoes
-- 1) Cria tabela `configuracoes` (por usuário)
-- 2) Adiciona user_id em vagas/candidatos/faturas/custos
-- 3) Restringe RLS para que cada usuário veja somente seus dados
-- ============================================================

-- ---------- 1. Tabela configuracoes ----------
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nome_empresa text NOT NULL DEFAULT '',
  data_inicio_operacao date NOT NULL DEFAULT '2026-04-01',
  meta_anual_lucro numeric NOT NULL DEFAULT 0,
  moeda text NOT NULL DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own configuracoes"
  ON public.configuracoes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configuracoes"
  ON public.configuracoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configuracoes"
  ON public.configuracoes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own configuracoes"
  ON public.configuracoes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 2. Adicionar user_id nas tabelas operacionais ----------
ALTER TABLE public.vagas      ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.faturas    ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.custos     ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill: como só existe 1 usuário no projeto, atribuir tudo a ele
UPDATE public.vagas      SET user_id = '91d2f3c0-fec3-4b7f-84e4-d14e5fd68fef' WHERE user_id IS NULL;
UPDATE public.candidatos SET user_id = '91d2f3c0-fec3-4b7f-84e4-d14e5fd68fef' WHERE user_id IS NULL;
UPDATE public.faturas    SET user_id = '91d2f3c0-fec3-4b7f-84e4-d14e5fd68fef' WHERE user_id IS NULL;
UPDATE public.custos     SET user_id = '91d2f3c0-fec3-4b7f-84e4-d14e5fd68fef' WHERE user_id IS NULL;

ALTER TABLE public.vagas      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.candidatos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.faturas    ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.custos     ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.vagas      ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.candidatos ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.faturas    ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.custos     ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_vagas_user_id      ON public.vagas(user_id);
CREATE INDEX IF NOT EXISTS idx_candidatos_user_id ON public.candidatos(user_id);
CREATE INDEX IF NOT EXISTS idx_faturas_user_id    ON public.faturas(user_id);
CREATE INDEX IF NOT EXISTS idx_custos_user_id     ON public.custos(user_id);

-- ---------- 3. Substituir RLS antigas (qualquer autenticado) por owner-scoped ----------
-- vagas
DROP POLICY IF EXISTS "Known users can view vagas"   ON public.vagas;
DROP POLICY IF EXISTS "Known users can create vagas" ON public.vagas;
DROP POLICY IF EXISTS "Known users can update vagas" ON public.vagas;
DROP POLICY IF EXISTS "Known users can delete vagas" ON public.vagas;

CREATE POLICY "Users can view own vagas"   ON public.vagas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vagas" ON public.vagas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vagas" ON public.vagas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own vagas" ON public.vagas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- candidatos
DROP POLICY IF EXISTS "Known users can view candidatos"   ON public.candidatos;
DROP POLICY IF EXISTS "Known users can create candidatos" ON public.candidatos;
DROP POLICY IF EXISTS "Known users can update candidatos" ON public.candidatos;
DROP POLICY IF EXISTS "Known users can delete candidatos" ON public.candidatos;

CREATE POLICY "Users can view own candidatos"   ON public.candidatos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own candidatos" ON public.candidatos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own candidatos" ON public.candidatos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own candidatos" ON public.candidatos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- faturas
DROP POLICY IF EXISTS "Known users can view faturas"   ON public.faturas;
DROP POLICY IF EXISTS "Known users can create faturas" ON public.faturas;
DROP POLICY IF EXISTS "Known users can update faturas" ON public.faturas;
DROP POLICY IF EXISTS "Known users can delete faturas" ON public.faturas;

CREATE POLICY "Users can view own faturas"   ON public.faturas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own faturas" ON public.faturas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own faturas" ON public.faturas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own faturas" ON public.faturas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- custos
DROP POLICY IF EXISTS "Known users can view custos"   ON public.custos;
DROP POLICY IF EXISTS "Known users can create custos" ON public.custos;
DROP POLICY IF EXISTS "Known users can update custos" ON public.custos;
DROP POLICY IF EXISTS "Known users can delete custos" ON public.custos;

CREATE POLICY "Users can view own custos"   ON public.custos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custos" ON public.custos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custos" ON public.custos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own custos" ON public.custos FOR DELETE TO authenticated USING (auth.uid() = user_id);
