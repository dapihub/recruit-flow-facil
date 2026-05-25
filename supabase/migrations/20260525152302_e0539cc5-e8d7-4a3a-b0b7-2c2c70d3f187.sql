
-- Tighten RLS: replace permissive "Equipe" policies with owner-scoped ones

-- candidatos
DROP POLICY IF EXISTS "Equipe vê candidatos" ON public.candidatos;
DROP POLICY IF EXISTS "Equipe cria candidatos" ON public.candidatos;
DROP POLICY IF EXISTS "Equipe atualiza candidatos" ON public.candidatos;
DROP POLICY IF EXISTS "Equipe deleta candidatos" ON public.candidatos;
CREATE POLICY "Owners select candidatos" ON public.candidatos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert candidatos" ON public.candidatos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update candidatos" ON public.candidatos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete candidatos" ON public.candidatos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- custos
DROP POLICY IF EXISTS "Equipe vê custos" ON public.custos;
DROP POLICY IF EXISTS "Equipe cria custos" ON public.custos;
DROP POLICY IF EXISTS "Equipe atualiza custos" ON public.custos;
DROP POLICY IF EXISTS "Equipe deleta custos" ON public.custos;
CREATE POLICY "Owners select custos" ON public.custos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert custos" ON public.custos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update custos" ON public.custos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete custos" ON public.custos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- faturas
DROP POLICY IF EXISTS "Equipe vê faturas" ON public.faturas;
DROP POLICY IF EXISTS "Equipe cria faturas" ON public.faturas;
DROP POLICY IF EXISTS "Equipe atualiza faturas" ON public.faturas;
DROP POLICY IF EXISTS "Equipe deleta faturas" ON public.faturas;
CREATE POLICY "Owners select faturas" ON public.faturas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert faturas" ON public.faturas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update faturas" ON public.faturas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete faturas" ON public.faturas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- vagas
DROP POLICY IF EXISTS "Equipe vê vagas" ON public.vagas;
DROP POLICY IF EXISTS "Equipe cria vagas" ON public.vagas;
DROP POLICY IF EXISTS "Equipe atualiza vagas" ON public.vagas;
DROP POLICY IF EXISTS "Equipe deleta vagas" ON public.vagas;
CREATE POLICY "Owners select vagas" ON public.vagas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert vagas" ON public.vagas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update vagas" ON public.vagas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete vagas" ON public.vagas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles: restrict reads to own profile
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
