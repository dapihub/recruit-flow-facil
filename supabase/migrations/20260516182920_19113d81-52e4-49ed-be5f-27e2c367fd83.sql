ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS vaga_id uuid;
CREATE INDEX IF NOT EXISTS idx_faturas_vaga_id ON public.faturas(vaga_id);
CREATE INDEX IF NOT EXISTS idx_custos_vaga_id ON public.custos(vaga_id);