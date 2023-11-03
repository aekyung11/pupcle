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
  -- ex. [{bucket: "WBC", type: "number", safeRangeStart: 10, safeRangeEnd: 20, tooltip: "White blood cell count"}]
  -- this field is only used when has_data is true
  default_point_buckets jsonb,
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
  has_data,
  default_point_buckets
) on app_public.exam_categories to :DATABASE_VISITOR;
grant update (
  id,
  user_id,
  name,
  has_data,
  default_point_buckets
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
  insert into app_public.exam_categories(user_id, name, is_default_category, has_data, default_point_buckets) values(NEW.id, '기본혈액검사(CBC)', true, true, '[{"bucket":"WBC","type":"number","safeRangeStart":5.05,"safeRangeEnd":16.76,"tooltip":"백혈구, White Blood Cell.\n수치가 높으면 알레르기 및 흥분, 스트레스성 염증, 암, 세균 감염 등을 의심할 수 있으며, 수치가 낮으면 백혈병, 바이러스 감염 등을 의심할 수 있습니다."},{"bucket":"RBC","type":"number","safeRangeStart":5.65,"safeRangeEnd":8.78,"tooltip":"적혈구, Red Blood Cell\n수치가 높으면 구토, 설사, 탈수, 신장암, 다혈 구혈증, 심폐질환 등을 의심할 수 있으며, 수치가 낮으면 빈혈, 적혈구 생성 이상, 골수 억제 등을 의심할 수 있습니다."},{"bucket":"HGB","type":"number","safeRangeStart":13.1,"safeRangeEnd":20.5,"tooltip":"혈색소, 헤모글로빈, Hemoglobin.\n수치가 높으면 다혈증을 의심할 수 있고, 수치가 낮으면 빈혈을 의심할 수 있습니다."},{"bucket":"HCT","type":"number","safeRangeStart":37.3,"safeRangeEnd":61.7,"tooltip":"헤마토크리트, Hematocrit.\n수치가 높아지면 혈액이 진하게 되며 탈수 증세가 나타날 수 있고, 다혈증, 심장 질환, 폐 질환을 의심할 수 있고, 수치가 낮으면 빈혈을 의심할 수 있습니다."},{"bucket":"MCV","type":"number","safeRangeStart":61.6,"safeRangeEnd":73.5,"tooltip":"평균적혈구용적, Mean Corpuscular Volume.\n수치가 높으면 악성빈혈, 간질환, 비타민B12 또는 엽산의 결핍 등을 의심할 수 있으며, 수치가 낮을 경우 소적혈구 빈혈, 철 결핍성 빈혈, 알루미늄 또는 납 중독 등을 의심할 수 있습니다."},{"bucket":"MCH","type":"number","safeRangeStart":21.2,"safeRangeEnd":25.9,"tooltip":"평균적혈구혈색소량, Mean Corpuscular Hemoglobin.\n빈혈의 분류에 이용되며, 수치가 높을 시 고지혈증, 백혈구 증가증을 의심할 수 있고, 수치가 낮으면 빈혈을 의심할 수 있습니다."},{"bucket":"MCHC","type":"number","safeRangeStart":30,"safeRangeEnd":38,"tooltip":"평균헤모글로빈 농도, Mean Corpuscular Hemoglobin Concentration,\n수치가 높을 시 탈수와 구상 적혈구 증가증 등이 의심되며, 수치가 낮으면 빈혈, 출혈, 철분 결핍을 의심할 수 있습니다."},{"bucket":"RDW-CV","type":"number","safeRangeStart":13.6,"safeRangeEnd":21.7,"tooltip":"적혈구분포폭, Red cell Distribution Width(%).\n 수치가 높으면 크기가 다양한 적혈구가 섞여있다고 볼 수 있으며, 수치가 낮으면 크기가 비슷한 적혈구가 돌아다닌다고 볼 수 있습니다. 다른 수치들과 연결지어 질환을 의심할 수 있습니다."},{"bucket":"LYM","type":"number","safeRangeStart":1.05,"safeRangeEnd":5.1,"tooltip":"림프구, Lymphocyte,\n수치가 높을 시 바이러스성 질환, 세균 감염, 암 등을 의심할 수 있고, 수치가 낮으면 패혈증이나 후천성 면역결핍증후군 등을 의심할 수 있습니다."},{"bucket":"EO(EOS)","type":"number","safeRangeStart":0.06,"safeRangeEnd":1.23,"tooltip":"호산구, Eosinophil,\n수치가 높을 시 기생충, 염증성 질한, 알레르기, 피부질환을 의심할 수 있으며, 수치가 낮을 경우 스트레스 또는 쿠싱증후군 등을 의심할 수 있습니다."},{"bucket":"PLT","type":"number","safeRangeStart":148,"safeRangeEnd":484,"tooltip":"혈소판, Platelet.\n 수치가 높으면 급성 출혈 후 골수 이상과 스트레스를 의심할 수 있으며, 수치가 낮으면 출혈이 멈추지 않거나 또는 출혈이 잘 일어날 수 있습니다."}]'::jsonb) on conflict do nothing;
  -- insert into app_public.exam_categories(user_id, name, is_default_category, has_data, default_point_buckets) values(NEW.id, '혈청화학검사', true, true, '[{"bucket":"WBC","type":"number","safeRangeStart":10,"safeRangeEnd":20,"tooltip":"White Blood Cell Count"},{"bucket":"WBC-Lymph","type":"number","safeRangeStart":1,"safeRangeEnd":10,"tooltip":"Wite Blood Cell Lymph"},{"bucket":"WBC-Gran","type":"number","safeRangeStart":5,"safeRangeEnd":15,"tooltip":"WBC-Gran"},{"bucket":"RBC","type":"number","safeRangeStart":5,"safeRangeEnd":10,"tooltip":"Red Blood Cell Count"},{"bucket":"HGB","type":"number","safeRangeStart":10,"tooltip":"HGB"},{"bucket":"HCT","type":"number","safeRangeStart":10,"safeRangeEnd":100,"tooltip":"HCT"},{"bucket":"MCV","type":"number","safeRangeStart":10,"safeRangeEnd":20,"tooltip":"MCV"},{"bucket":"MCH","type":"number","safeRangeStart":300,"safeRangeEnd":500,"tooltip":"MCH"},{"bucket":"MCHC","type":"number","safeRangeStart":10,"safeRangeEnd":100,"tooltip":"MCHC"},{"bucket":"RDW-CV","type":"number","safeRangeStart":10,"safeRangeEnd":20,"tooltip":"RDW-CV"}]'::jsonb) on conflict do nothing;
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
