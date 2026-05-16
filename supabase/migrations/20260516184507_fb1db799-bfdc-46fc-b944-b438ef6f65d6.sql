-- 1) Colunas
ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS prazo_garantia integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS garantia_inicio date;

-- 2) Trigger: ao entrar em "Em Garantia", marca data de início
CREATE OR REPLACE FUNCTION public.handle_vaga_garantia()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.etapa = 'Em Garantia' AND (OLD.etapa IS DISTINCT FROM 'Em Garantia') AND NEW.garantia_inicio IS NULL THEN
    NEW.garantia_inicio := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vaga_garantia ON public.vagas;
CREATE TRIGGER trg_vaga_garantia
BEFORE UPDATE ON public.vagas
FOR EACH ROW
EXECUTE FUNCTION public.handle_vaga_garantia();

-- 3) Função que finaliza vagas com garantia vencida
CREATE OR REPLACE FUNCTION public.finalize_expired_garantias()
RETURNS void
LANGUAGE sql
SET search_path TO 'public'
AS $$
  UPDATE public.vagas
  SET etapa = 'Finalizada', status = 'Fechada'
  WHERE etapa = 'Em Garantia'
    AND garantia_inicio IS NOT NULL
    AND (garantia_inicio + (prazo_garantia || ' days')::interval)::date <= CURRENT_DATE;
$$;

-- 4) Agenda execução diária via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('finalize-expired-garantias');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'finalize-expired-garantias',
  '0 3 * * *',
  $$SELECT public.finalize_expired_garantias();$$
);