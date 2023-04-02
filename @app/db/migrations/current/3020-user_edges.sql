create table app_public.share_level (
  level       text primary key,
  description text
);

comment on table app_public.share_level is E'@enum';

insert into app_public.share_level (level, description) values
  ('NONE', 'none'),
  ('SUMMARY', 'summary');

grant select on table app_public.share_level to :DATABASE_AUTHENTICATOR;

create table app_public.user_edges (
  from_user_id          uuid not null references app_public.users on delete cascade,
  to_user_id            uuid not null references app_public.users on delete cascade,
  primary key (from_user_id, to_user_id),
  daily_records_shared  text not null references app_public.share_level,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table app_public.user_edges enable row level security;

create policy select_own on app_public.user_edges for select using (from_user_id = app_public.current_user_id());
-- NOTE: `insert` is not granted, because we'll handle that separately
create policy update_own on app_public.user_edges for update using (from_user_id = app_public.current_user_id());
create policy delete_own on app_public.user_edges for delete using (from_user_id = app_public.current_user_id());
grant select on app_public.user_edges to :DATABASE_VISITOR;
grant update(daily_records_shared) on app_public.user_edges to :DATABASE_VISITOR;
grant delete on app_public.user_edges to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.user_edges
  for each row
  execute procedure app_private.tg__timestamps();

/*
 * When we insert into `users` we _always_ want there to be a matching
 * `user_entries` entry, so we have a trigger to enforce this:
 */
create function app_public.tg_user_edges__unfriend() returns trigger as $$
begin
  delete from app_public.user_edges where from_user_id = OLD.to_user_id and to_user_id = OLD.from_user_id;
  return null;
end;
$$ language plpgsql volatile set search_path to pg_catalog, public, pg_temp;
create trigger _200_unfriend
  after delete on app_public.user_edges
  for each row
  execute procedure app_public.tg_user_edges__unfriend();
comment on function app_public.tg_user_edges__unfriend() is
  E'Ensures that every user record has an associated user_entries record.';
