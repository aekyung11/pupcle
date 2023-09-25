create type app_public.money as (
  currency text,
  amount text
);

create table app_public.exam_categories (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references app_public.users on delete cascade,
  name                text not null,
  is_default_category boolean not null default false,
  has_data            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, name)
);
alter table app_public.exam_categories enable row level security;

create index on app_public.exam_categories (name);

create policy select_own on app_public.exam_categories for select using (user_id = app_public.current_user_id());
create policy insert_own on app_public.exam_categories for insert with check (user_id = app_public.current_user_id() and is_default_category is not true);
create policy update_own on app_public.exam_categories for update using (user_id = app_public.current_user_id() and is_default_category is not true);
create policy delete_own on app_public.exam_categories for delete using (user_id = app_public.current_user_id() and is_default_category is not true);

grant select, delete on app_public.exam_categories to :DATABASE_VISITOR;
grant insert (
  id,
  user_id,
  name,
  has_data
) on app_public.exam_categories to :DATABASE_VISITOR;
grant update (
  id,
  user_id,
  name,
  has_data
) on app_public.exam_categories to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.exam_categories
  for each row
  execute procedure app_private.tg__timestamps();

create function app_public.tg_exam_categories__insert_with_user() returns trigger as $$
begin
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '치과 검진', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '슬개골 검사', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '피부 검사', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '심장 청진', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '신체 검사', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category, has_data) values(NEW.id, '기본혈액검사(CBC)', true, true) on conflict do nothing;
  return NEW;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;
create trigger _570_insert_exam_categories
  after insert on app_public.users
  for each row
  execute procedure app_public.tg_exam_categories__insert_with_user();
comment on function app_public.tg_exam_categories__insert_with_user() is
  E'Ensures that every user has their own set of basic exam categories.';

create table app_public.exam_results (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references app_public.users on delete cascade,
  pet_id                  uuid not null references app_public.pets on delete cascade,
  exam_category_id  uuid not null references app_public.exam_categories on delete restrict,
  taken_at                timestamptz,
  cost                    app_public.money,
  -- always set by trigger
  poi_id                  uuid references app_public.poi on delete restrict,
  kakao_id                varchar(255),
  next_reservation        timestamptz,
  memo                    text,
  -- only numeric values are currently supported
  -- ex. {points: [{bucket: "WBC", type: "number", value: 11.8}]}
  -- this field is only used when the exam_category specifies has_data
  exam_data               jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  sort_datetime           timestamptz generated always as (coalesce(taken_at, created_at)) stored
);
alter table app_public.exam_results enable row level security;

create index on app_public.exam_results (user_id, pet_id, sort_datetime, exam_category_id);
create index on app_public.exam_results (pet_id, sort_datetime, exam_category_id);
create index on app_public.exam_results (sort_datetime, exam_category_id);
create index on app_public.exam_results (exam_category_id);

create policy select_own on app_public.exam_results for select using (user_id = app_public.current_user_id());
create policy insert_own on app_public.exam_results for insert with check (user_id = app_public.current_user_id());
create policy update_own on app_public.exam_results for update using (user_id = app_public.current_user_id());
create policy delete_own on app_public.exam_results for delete using (user_id = app_public.current_user_id());

grant select, delete on app_public.exam_results to :DATABASE_VISITOR;
grant insert (
  id,
  user_id,
  pet_id,
  exam_category_id,
  taken_at,
  cost,
  poi_id,
  kakao_id,
  next_reservation,
  memo,
  exam_data
) on app_public.exam_results to :DATABASE_VISITOR;
grant update (
  user_id,
  pet_id,
  exam_category_id,
  taken_at,
  cost,
  poi_id,
  kakao_id,
  next_reservation,
  memo,
  exam_data
) on app_public.exam_results to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.exam_results
  for each row
  execute procedure app_private.tg__timestamps();

create trigger _200_poi_exam_results_create_or_update_poi
  before insert or update on app_public.exam_results
  for each row
  execute procedure app_public.tg__poi_related__create_or_replace_poi();
comment on function app_public.tg__poi_related__create_or_replace_poi() is
  E'Sets a poi for this poi related object';

create table app_public.user_asset_kind (
  kind        text primary key,
  description text
);

comment on table app_public.user_asset_kind is E'@enum';

insert into app_public.user_asset_kind (kind, description) values
  ('IMAGE', 'Image');

grant select on table app_public.user_asset_kind to :DATABASE_AUTHENTICATOR;

create table app_public.exam_result_assets (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references app_public.users on delete cascade,
  exam_result_id    uuid not null references app_public.exam_results on delete cascade,
  kind                    text not null references app_public.user_asset_kind,
  asset_url               text check(asset_url ~ '^https?://[^/]+'),
  metadata                jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table app_public.exam_result_assets enable row level security;

create index on app_public.exam_result_assets (user_id, exam_result_id);
create index on app_public.exam_result_assets (exam_result_id);

create policy select_own on app_public.exam_result_assets for select using (user_id = app_public.current_user_id());
create policy insert_own on app_public.exam_result_assets for insert with check (user_id = app_public.current_user_id());
create policy update_own on app_public.exam_result_assets for update using (user_id = app_public.current_user_id());
create policy delete_own on app_public.exam_result_assets for delete using (user_id = app_public.current_user_id());

grant select, delete on app_public.exam_result_assets to :DATABASE_VISITOR;
grant insert (
  id,
  user_id,
  exam_result_id,
  kind,
  asset_url,
  metadata
) on app_public.exam_result_assets to :DATABASE_VISITOR;
grant update (
  user_id,
  exam_result_id,
  kind,
  asset_url,
  metadata
) on app_public.exam_result_assets to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.exam_result_assets
  for each row
  execute procedure app_private.tg__timestamps();
