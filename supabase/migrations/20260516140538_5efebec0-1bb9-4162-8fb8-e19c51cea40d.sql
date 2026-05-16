alter table public.vagas
add column if not exists candidatos integer not null default 0;

create or replace function public.sync_vaga_candidatos_count()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.vaga_id is not null then
      update public.vagas
      set candidatos = (select count(*) from public.candidatos where vaga_id = old.vaga_id)
      where id = old.vaga_id;
    end if;
    return old;
  end if;

  if new.vaga_id is not null then
    update public.vagas
    set candidatos = (select count(*) from public.candidatos where vaga_id = new.vaga_id)
    where id = new.vaga_id;
  end if;

  if tg_op = 'UPDATE' and old.vaga_id is distinct from new.vaga_id and old.vaga_id is not null then
    update public.vagas
    set candidatos = (select count(*) from public.candidatos where vaga_id = old.vaga_id)
    where id = old.vaga_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_vaga_candidatos_count on public.candidatos;
create trigger sync_vaga_candidatos_count
after insert or update or delete on public.candidatos
for each row
execute function public.sync_vaga_candidatos_count();