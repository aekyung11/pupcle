create table app_public.pet_kind (
  kind        text primary key,
  description text
);

comment on table app_public.pet_kind is E'@enum';

insert into app_public.pet_kind (kind, description) values
  ('DOG', 'Dog');

grant select on table app_public.pet_kind to :DATABASE_AUTHENTICATOR;

create table app_public.pet_gender (
  gender      text primary key,
  description text
);

comment on table app_public.pet_gender is E'@enum';

insert into app_public.pet_gender (gender, description) values
  ('M', 'male'),
  ('F', 'female');

grant select on table app_public.pet_gender to :DATABASE_AUTHENTICATOR;

create type app_public.weight_unit as enum (
  'kg',
  'lbs'
);

create type app_public.weight as (
  unit  app_public.weight_unit,
  value double precision
);

create table app_public.pets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references app_public.users on delete cascade,
  kind          text not null references app_public.pet_kind,
  name          text not null,
  -- TODO: maybe change this to sex
  gender        text not null references app_public.pet_gender,
  dob           date not null,
  weight        app_public.weight,
  neutered      boolean not null,
  avatar_url    text check(avatar_url ~ '^https?://[^/]+'),
  vaccinations  jsonb,
  injections    jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table app_public.pets enable row level security;

create index on app_public.pets (user_id, kind);
create index on app_public.pets (kind);

create policy select_own on app_public.pets for select using (user_id = app_public.current_user_id());
create policy insert_own on app_public.pets for insert with check (user_id = app_public.current_user_id());
create policy update_own on app_public.pets for update using (user_id = app_public.current_user_id());

create policy select_shared on app_public.pets
  for select using (user_id in (select app_public.current_user_shared_friend_ids()));

grant select, delete on app_public.pets to :DATABASE_VISITOR;
grant insert (
  user_id,
  kind,
  name,
  gender,
  dob,
  weight,
  neutered,
  avatar_url,
  vaccinations,
  injections
) on app_public.pets to :DATABASE_VISITOR;
grant update (
  -- kind,
  name,
  gender,
  dob,
  weight,
  neutered,
  avatar_url,
  vaccinations,
  injections
) on app_public.pets to :DATABASE_VISITOR;

-- TODO: trigger: when creating a pet, create basic_exam_categories for the defaults

create table app_public.daily_record_day_status (
  status      text primary key,
  description text
);

comment on table app_public.daily_record_day_status is E'@enum';

insert into app_public.daily_record_day_status (status, description) values
  ('ALL_GOOD', 'all_good'),
  ('ALL_BAD', 'all_bad'),
  ('MIXED', 'mixed'),
  ('NONE', 'none');

grant select on table app_public.daily_record_day_status to :DATABASE_AUTHENTICATOR;

create table app_public.daily_record_status (
  status      text primary key,
  description text
);

comment on table app_public.daily_record_status is E'@enum';

insert into app_public.daily_record_status (status, description) values
  ('GOOD', 'good'),
  ('BAD', 'bad');

grant select on table app_public.daily_record_status to :DATABASE_AUTHENTICATOR;

create table app_public.shared_daily_records (
  user_id                 uuid not null references app_public.users on delete cascade,
  pet_id                  uuid not null references app_public.pets on delete cascade,
  day                     date not null,
  primary key (user_id, pet_id, day),
  day_status              text not null references app_public.daily_record_day_status,
  is_complete             boolean not null default false,
  ever_completed          boolean not null default false,
  complete_status_count   int not null default 0,
  -- maybe add max status count
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
alter table app_public.shared_daily_records enable row level security;

create index on app_public.shared_daily_records (user_id, pet_id, day);
create index on app_public.shared_daily_records (pet_id, day);
create index on app_public.shared_daily_records (day);

create policy select_own on app_public.shared_daily_records for select using (user_id = app_public.current_user_id());
-- the user cannot update anything more than 3 days old
create policy insert_own on app_public.shared_daily_records for insert with check (user_id = app_public.current_user_id() and day >= now() - '3 days'::interval);
-- no update because all columns are computed
-- create policy update_own on app_public.shared_daily_records for update using (user_id = app_public.current_user_id());

create policy select_shared on app_public.shared_daily_records
  for select using (user_id in (select app_public.current_user_shared_friend_ids()));

grant select on app_public.shared_daily_records to :DATABASE_VISITOR;
grant insert (
  user_id,
  pet_id,
  day
) on app_public.shared_daily_records to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.shared_daily_records
  for each row
  execute procedure app_private.tg__timestamps();

create table app_public.private_daily_records (
  user_id           uuid not null references app_public.users on delete cascade,
  pet_id            uuid not null references app_public.pets on delete cascade,
  day               date not null,
  primary key (user_id, pet_id, day),
  -- maybe add shared_daily_record_id
  sleep_status      text references app_public.daily_record_status,
  -- "" comment means no comment and submitted
  sleep_comment     text,
  diet_status       text references app_public.daily_record_status,
  diet_comment      text,
  walking_status    text references app_public.daily_record_status,
  walking_comment   text,
  play_status       text references app_public.daily_record_status,
  play_comment      text,
  bathroom_status   text references app_public.daily_record_status,
  bathroom_comment  text,
  health_status     text references app_public.daily_record_status,
  health_comment    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table app_public.private_daily_records enable row level security;

create index on app_public.private_daily_records (user_id, pet_id, day);
create index on app_public.private_daily_records (pet_id, day);
create index on app_public.private_daily_records (day);

create policy select_own on app_public.private_daily_records for select using (user_id = app_public.current_user_id());
-- the user cannot update anything more than 3 days old
create policy insert_own on app_public.private_daily_records for insert with check (user_id = app_public.current_user_id() and day >= now() - '3 days'::interval);
create policy update_own on app_public.private_daily_records for update using (user_id = app_public.current_user_id() and day >= now() - '3 days'::interval);

grant select on app_public.private_daily_records to :DATABASE_VISITOR;
grant insert (
  user_id,
  pet_id,
  day,
  sleep_status,
  sleep_comment,
  diet_status,
  diet_comment,
  walking_status,
  walking_comment,
  play_status,
  play_comment,
  bathroom_status,
  bathroom_comment,
  health_status,
  health_comment
) on app_public.private_daily_records to :DATABASE_VISITOR;
grant update (
  sleep_status,
  sleep_comment,
  diet_status,
  diet_comment,
  walking_status,
  walking_comment,
  play_status,
  play_comment,
  bathroom_status,
  bathroom_comment,
  health_status,
  health_comment
) on app_public.private_daily_records to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.private_daily_records
  for each row
  execute procedure app_private.tg__timestamps();

create function app_public.tg_update_shared_daily_records() returns trigger as $$
declare
  v_complete_status_count int;
  v_good_status_count int;
  v_bad_status_count int;
  v_day_status text;
  v_is_complete boolean;
begin
  select sum(c) into v_complete_status_count from (
    select (case when NEW.sleep_status is not null and NEW.sleep_comment is not null then 1 else 0 end) as c
    union all
    select (case when NEW.diet_status is not null and NEW.diet_comment is not null then 1 else 0 end) as c
    union all
    select (case when NEW.walking_status is not null and NEW.walking_comment is not null then 1 else 0 end) as c
    union all
    select (case when NEW.play_status is not null and NEW.play_comment is not null then 1 else 0 end) as c
    union all
    select (case when NEW.bathroom_status is not null and NEW.bathroom_comment is not null then 1 else 0 end) as c
    union all
    select (case when NEW.health_status is not null and NEW.health_comment is not null then 1 else 0 end) as c
  ) as subquery1;

  select sum(good) into v_good_status_count from (
    select (case when NEW.sleep_status = 'GOOD' then 1 else 0 end) as good
    union all
    select (case when NEW.diet_status = 'GOOD' then 1 else 0 end) as good
    union all
    select (case when NEW.walking_status = 'GOOD' then 1 else 0 end) as good
    union all
    select (case when NEW.play_status = 'GOOD' then 1 else 0 end) as good
    union all
    select (case when NEW.bathroom_status = 'GOOD' then 1 else 0 end) as good
    union all
    select (case when NEW.health_status = 'GOOD' then 1 else 0 end) as good
  ) as subquery2;

  select sum(bad) into v_bad_status_count from (
    select (case when NEW.sleep_status = 'BAD' then 1 else 0 end) as bad
    union all
    select (case when NEW.diet_status = 'BAD' then 1 else 0 end) as bad
    union all
    select (case when NEW.walking_status = 'BAD' then 1 else 0 end) as bad
    union all
    select (case when NEW.play_status = 'BAD' then 1 else 0 end) as bad
    union all
    select (case when NEW.bathroom_status = 'BAD' then 1 else 0 end) as bad
    union all
    select (case when NEW.health_status = 'BAD' then 1 else 0 end) as bad
  ) as subquery3;

  if v_complete_status_count = 0 then
    v_day_status := 'NONE';
  elsif v_good_status_count = v_complete_status_count then
    v_day_status := 'ALL_GOOD';
  elsif v_bad_status_count = v_complete_status_count then
    v_day_status := 'ALL_BAD';
  else
    v_day_status := 'MIXED';
  end if;

  v_is_complete := v_complete_status_count = 6;

  insert into app_public.shared_daily_records (user_id, pet_id, day, day_status, is_complete, ever_completed, complete_status_count) values
    (NEW.user_id, NEW.pet_id, NEW.day, v_day_status, v_is_complete, v_is_complete, v_complete_status_count)
  on conflict (user_id, pet_id, day) do update
  set (day, day_status, is_complete, ever_completed, complete_status_count) = (EXCLUDED.day, EXCLUDED.day_status, EXCLUDED.is_complete, shared_daily_records.ever_completed or EXCLUDED.ever_completed, EXCLUDED.complete_status_count);
  return null;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

create trigger _200_update_shared_daily_records
  after insert or update
  on app_public.private_daily_records
  for each row
  execute procedure app_public.tg_update_shared_daily_records();
comment on function app_public.tg_update_shared_daily_records() is
  E'Ensures that shared_daily_records is up to date when the user updates their private_daily_records.';

create function app_public.tg_pupcle_on_complete_daily_record() returns trigger as $$
declare
  v_newly_completed boolean;
begin
  if tg_when = 'AFTER' then
    v_newly_completed := false;
    if (TG_OP = 'INSERT') then
      if NEW.ever_completed is true then
        v_newly_completed := true;
      end if;
    elsif (TG_OP = 'UPDATE') then
      if OLD.ever_completed is false and NEW.ever_completed is true then
        v_newly_completed := true;
      end if;
    end if;

    if v_newly_completed = true then
      update app_public.user_entries
      set pupcle_balance = pupcle_balance + 1, total_pupcles_earned = total_pupcles_earned + 1
      where user_id = NEW.user_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

create trigger _300_pupcle_on_complete_daily_record
  after insert or update
  on app_public.shared_daily_records
  for each row
  execute procedure app_public.tg_pupcle_on_complete_daily_record();
comment on function app_public.tg_pupcle_on_complete_daily_record() is
  E'Gives a pupcle to the user when the user completes a pet''s daily record';
