drop policy if exists "Authenticated users can view all vagas" on public.vagas;
drop policy if exists "Authenticated users can create vagas" on public.vagas;
drop policy if exists "Authenticated users can update vagas" on public.vagas;
drop policy if exists "Authenticated users can delete vagas" on public.vagas;

drop policy if exists "Authenticated users can view all candidatos" on public.candidatos;
drop policy if exists "Authenticated users can create candidatos" on public.candidatos;
drop policy if exists "Authenticated users can update candidatos" on public.candidatos;
drop policy if exists "Authenticated users can delete candidatos" on public.candidatos;

drop policy if exists "Authenticated users can view all faturas" on public.faturas;
drop policy if exists "Authenticated users can create faturas" on public.faturas;
drop policy if exists "Authenticated users can update faturas" on public.faturas;
drop policy if exists "Authenticated users can delete faturas" on public.faturas;

drop policy if exists "Authenticated users can view all custos" on public.custos;
drop policy if exists "Authenticated users can create custos" on public.custos;
drop policy if exists "Authenticated users can update custos" on public.custos;
drop policy if exists "Authenticated users can delete custos" on public.custos;

create policy "Known users can view vagas"
on public.vagas
for select
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can create vagas"
on public.vagas
for insert
to authenticated
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can update vagas"
on public.vagas
for update
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
)
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can delete vagas"
on public.vagas
for delete
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can view candidatos"
on public.candidatos
for select
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can create candidatos"
on public.candidatos
for insert
to authenticated
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can update candidatos"
on public.candidatos
for update
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
)
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can delete candidatos"
on public.candidatos
for delete
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can view faturas"
on public.faturas
for select
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can create faturas"
on public.faturas
for insert
to authenticated
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can update faturas"
on public.faturas
for update
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
)
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can delete faturas"
on public.faturas
for delete
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can view custos"
on public.custos
for select
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can create custos"
on public.custos
for insert
to authenticated
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can update custos"
on public.custos
for update
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
)
with check (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "Known users can delete custos"
on public.custos
for delete
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
  )
);