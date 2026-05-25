-- Sprint 1: Próxima ação com data no candidato
ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS proxima_acao_data date;

-- Sprint 2: Tabela de interações (timeline por candidato)
CREATE TABLE IF NOT EXISTS public.interacoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidato_id uuid NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  tipo        text NOT NULL CHECK (tipo IN ('Ligação','E-mail','Entrevista','Reunião','Nota','Outro')),
  data        date NOT NULL,
  descricao   text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_interacoes_candidato ON public.interacoes(candidato_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_user     ON public.interacoes(user_id);

-- RLS: cada usuário vê apenas suas próprias interações
CREATE POLICY "Usuário vê próprias interações"      ON public.interacoes FOR SELECT    TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprias interações"    ON public.interacoes FOR INSERT    TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprias interações"  ON public.interacoes FOR DELETE    TO authenticated USING (auth.uid() = user_id);

-- Sprint 3: garantia_vencimento calculado (view)
CREATE OR REPLACE VIEW public.vagas_garantia AS
SELECT
  v.id,
  v.cargo,
  v.empresa,
  v.etapa,
  v.garantia_inicio,
  v.prazo_garantia,
  CASE
    WHEN v.garantia_inicio IS NOT NULL AND v.prazo_garantia IS NOT NULL
    THEN (v.garantia_inicio::date + v.prazo_garantia * INTERVAL '1 day')::date
    ELSE NULL
  END AS garantia_vencimento
FROM public.vagas v
WHERE v.etapa = 'Em Garantia';
