create table app_public.poi_favorites (
  user_id               uuid not null references app_public.users on delete cascade,
  -- always set by trigger
  poi_id                uuid not null references app_public.poi on delete cascade,
  primary key (user_id, poi_id),
  kakao_id              varchar(255) not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table app_public.poi_favorites enable row level security;

create index on app_public.poi_favorites (kakao_id, user_id);
create index on app_public.poi_favorites (poi_id, user_id);
create index on app_public.poi_favorites (user_id);

create policy insert_own on app_public.poi_favorites for insert with check (user_id = app_public.current_user_id());
create policy update_own on app_public.poi_favorites for update using (user_id = app_public.current_user_id());
create policy delete_own on app_public.poi_favorites for delete using (user_id = app_public.current_user_id());

create policy select_all on app_public.poi_favorites for select using (true);

grant select on app_public.poi_favorites to :DATABASE_VISITOR;
grant insert (
  kakao_id,
  poi_id,
  user_id
) on app_public.poi_favorites to :DATABASE_VISITOR;
grant update (
  kakao_id,
  poi_id,
  user_id
) on app_public.poi_favorites to :DATABASE_VISITOR;
grant delete on app_public.poi_favorites to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.poi_favorites
  for each row
  execute procedure app_private.tg__timestamps();

create trigger _200_poi_favorites_create_poi
  before insert on app_public.poi_favorites
  for each row
  execute procedure app_public.tg__poi_related__create_or_replace_poi();
