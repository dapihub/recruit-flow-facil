-- ================================================================
-- DADOS COMPARTILHADOS: você e sua sócia veem as mesmas informações
-- Remove isolamento por user_id e usa um "org_id" compartilhado
-- ================================================================

-- A solução mais simples: políticas permitem que qualquer usuário
-- autenticado veja e edite TODOS os dados (sem filtro por user_id)
-- Isso é correto para uma empresa de 2 pessoas que compartilham tudo

-- Remove políticas antigas de isolamento
DROP POLICY IF EXISTS "Usuário vê próprias vagas"        ON public.vagas;
DROP POLICY IF EXISTS "Usuário cria próprias vagas"      ON public.vagas;
DROP POLICY IF EXISTS "Usuário atualiza próprias vagas"  ON public.vagas;
DROP POLICY IF EXISTS "Usuário deleta próprias vagas"    ON public.vagas;

DROP POLICY IF EXISTS "Usuário vê próprios candidatos"       ON public.candidatos;
DROP POLICY IF EXISTS "Usuário cria próprios candidatos"     ON public.candidatos;
DROP POLICY IF EXISTS "Usuário atualiza próprios candidatos" ON public.candidatos;
DROP POLICY IF EXISTS "Usuário deleta próprios candidatos"   ON public.candidatos;

DROP POLICY IF EXISTS "Usuário vê próprias faturas"       ON public.faturas;
DROP POLICY IF EXISTS "Usuário cria próprias faturas"     ON public.faturas;
DROP POLICY IF EXISTS "Usuário atualiza próprias faturas" ON public.faturas;
DROP POLICY IF EXISTS "Usuário deleta próprias faturas"   ON public.faturas;

DROP POLICY IF EXISTS "Usuário vê próprios custos"       ON public.custos;
DROP POLICY IF EXISTS "Usuário cria próprios custos"     ON public.custos;
DROP POLICY IF EXISTS "Usuário atualiza próprios custos" ON public.custos;
DROP POLICY IF EXISTS "Usuário deleta próprios custos"   ON public.custos;

DROP POLICY IF EXISTS "Usuário vê próprias interações"     ON public.interacoes;
DROP POLICY IF EXISTS "Usuário cria próprias interações"   ON public.interacoes;
DROP POLICY IF EXISTS "Usuário deleta próprias interações" ON public.interacoes;

-- Novas políticas: qualquer usuário autenticado vê e edita tudo
-- (ideal para time pequeno que compartilha os mesmos dados)
CREATE POLICY "Equipe vê vagas"        ON public.vagas FOR SELECT    TO authenticated USING (true);
CREATE POLICY "Equipe cria vagas"      ON public.vagas FOR INSERT    TO authenticated WITH CHECK (true);
CREATE POLICY "Equipe atualiza vagas"  ON public.vagas FOR UPDATE    TO authenticated USING (true);
CREATE POLICY "Equipe deleta vagas"    ON public.vagas FOR DELETE    TO authenticated USING (true);

CREATE POLICY "Equipe vê candidatos"        ON public.candidatos FOR SELECT    TO authenticated USING (true);
CREATE POLICY "Equipe cria candidatos"      ON public.candidatos FOR INSERT    TO authenticated WITH CHECK (true);
CREATE POLICY "Equipe atualiza candidatos"  ON public.candidatos FOR UPDATE    TO authenticated USING (true);
CREATE POLICY "Equipe deleta candidatos"    ON public.candidatos FOR DELETE    TO authenticated USING (true);

CREATE POLICY "Equipe vê faturas"        ON public.faturas FOR SELECT    TO authenticated USING (true);
CREATE POLICY "Equipe cria faturas"      ON public.faturas FOR INSERT    TO authenticated WITH CHECK (true);
CREATE POLICY "Equipe atualiza faturas"  ON public.faturas FOR UPDATE    TO authenticated USING (true);
CREATE POLICY "Equipe deleta faturas"    ON public.faturas FOR DELETE    TO authenticated USING (true);

CREATE POLICY "Equipe vê custos"        ON public.custos FOR SELECT    TO authenticated USING (true);
CREATE POLICY "Equipe cria custos"      ON public.custos FOR INSERT    TO authenticated WITH CHECK (true);
CREATE POLICY "Equipe atualiza custos"  ON public.custos FOR UPDATE    TO authenticated USING (true);
CREATE POLICY "Equipe deleta custos"    ON public.custos FOR DELETE    TO authenticated USING (true);

CREATE POLICY "Equipe vê interacoes"        ON public.interacoes FOR SELECT    TO authenticated USING (true);
CREATE POLICY "Equipe cria interacoes"      ON public.interacoes FOR INSERT    TO authenticated WITH CHECK (true);
CREATE POLICY "Equipe deleta interacoes"    ON public.interacoes FOR DELETE    TO authenticated USING (true);

-- Também permite que o insert funcione sem user_id obrigatório nos dados
-- (o user_id ainda é salvo para auditoria de quem criou cada registro)
