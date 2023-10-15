create table app_public.mission_period_kind (
  period      text primary key,
  description text
);

comment on table app_public.mission_period_kind is E'@enum';

insert into app_public.mission_period_kind (period, description) values
  ('DAILY', 'Daily');

grant select on table app_public.mission_period_kind to :DATABASE_AUTHENTICATOR;

create table app_public.missions (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text not null,
  keywords            text[],
  reward              int not null default 1,
  participant_count   int not null default 0,
  period              text not null references app_public.mission_period_kind,
  day                 date, -- for daily missions. could be null
  required_objects    text[],
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (name, period, day)
);
alter table app_public.missions enable row level security;

create index on app_public.missions (name, period, day);
create index on app_public.missions (period, day);
create index on app_public.missions (day);

create policy select_all on app_public.missions for select using (true);
create policy insert_admin on app_public.missions for insert with check (exists (select 1 from app_public.users where is_admin is true and id = app_public.current_user_id()));
create policy update_admin on app_public.missions for update using (exists (select 1 from app_public.users where is_admin is true and id = app_public.current_user_id()));
create policy delete_admin on app_public.missions for delete using (exists (select 1 from app_public.users where is_admin is true and id = app_public.current_user_id()));

grant select, delete on app_public.missions to :DATABASE_VISITOR;
grant insert (
  id,
  name,
  description,
  keywords,
  reward,
  period,
  day,
  required_objects
) on app_public.missions to :DATABASE_VISITOR;
grant update (
  id,
  name,
  description,
  keywords,
  reward,
  period,
  day,
  required_objects
) on app_public.missions to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.missions
  for each row
  execute procedure app_private.tg__timestamps();

-- create table app_public.mission_participant_assets (
--   id                      uuid primary key default gen_random_uuid(),
--   user_id                 uuid not null references app_public.users on delete cascade,
--   kind                    text not null references app_public.user_asset_kind, -- only image is supported right now
--   asset_url               text check(asset_url ~ '^https?://[^/]+'),
--   metadata                jsonb not null default '{}'::jsonb,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now()
-- );
-- alter table app_public.mission_participant_assets enable row level security;

-- -- maybe disallow modification because it's proof the mission is done
-- create policy select_own on app_public.mission_participant_assets for select using (user_id = app_public.current_user_id());
-- create policy insert_own on app_public.mission_participant_assets for insert with check (user_id = app_public.current_user_id());
-- create policy update_own on app_public.mission_participant_assets for update using (user_id = app_public.current_user_id());
-- create policy delete_own on app_public.mission_participant_assets for delete using (user_id = app_public.current_user_id());

-- grant select, delete on app_public.mission_participant_assets to :DATABASE_VISITOR;
-- grant insert (
--   id,
--   user_id,
--   kind,
--   asset_url,
--   metadata
-- ) on app_public.mission_participant_assets to :DATABASE_VISITOR;
-- grant update (
--   user_id,
--   kind,
--   asset_url,
--   metadata
-- ) on app_public.mission_participant_assets to :DATABASE_VISITOR;

-- create trigger _100_timestamps
--   before insert or update on app_public.mission_participant_assets
--   for each row
--   execute procedure app_private.tg__timestamps();

create table mission_participants (
  id              uuid primary key default gen_random_uuid(),
  mission_id      uuid not null references app_public.missions on delete cascade,
  user_id         uuid not null references app_public.users on delete cascade,
  proof_image_url text check(proof_image_url ~ '^https?://[^/]+'),
  -- participate means completed
  -- is_complete     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, mission_id)
);
alter table app_public.mission_participants enable row level security;

create index on app_public.mission_participants (mission_id);

-- create index on app_public.mission_participants (user_id, mission_id, is_complete);
-- create index on app_public.mission_participants (mission_id, is_complete);
-- create index on app_public.mission_participants (is_complete);

create policy select_own on app_public.mission_participants for select using (user_id = app_public.current_user_id());
create policy select_friends on app_public.mission_participants for select using (user_id in (select app_public.current_user_shared_friend_ids()));
-- user must use a different API to participate/complete a mission (which will check date)

grant select on app_public.mission_participants to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.mission_participants
  for each row
  execute procedure app_private.tg__timestamps();

create function app_public.tg_update_count_on_participant_mission() returns trigger as $$
declare
  v_newly_participated boolean;
begin
  if tg_when = 'AFTER' then
    v_newly_participated := false;
    if (TG_OP = 'INSERT') then
      v_newly_participated := true;
    end if;

    if v_newly_participated = true then
      update app_public.missions
      set participant_count = participant_count + 1
      where id = NEW.mission_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

create trigger _200_update_count_on_participate_mission
  after insert or update
  on app_public.mission_participants
  for each row
  execute procedure app_public.tg_update_count_on_participant_mission();
comment on function app_public.tg_update_count_on_participant_mission() is
  E'Update participant count when a user participates in a mission';

create function app_public.tg_pupcles_on_complete_mission() returns trigger as $$
declare
  v_newly_completed boolean;
  v_mission app_public.missions;
begin
  if tg_when = 'AFTER' then
    v_newly_completed := false;
    if (TG_OP = 'INSERT') then
      v_newly_completed := true;
    end if;

    if v_newly_completed = true then
      select * into v_mission
      from app_public.missions
      where id = NEW.mission_id;

      update app_public.user_entries
      set pupcle_balance = pupcle_balance + v_mission.reward, total_pupcles_earned = total_pupcles_earned + v_mission.reward
      where user_id = NEW.user_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

create trigger _300_pupcles_on_complete_mission
  after insert or update
  on app_public.mission_participants
  for each row
  execute procedure app_public.tg_pupcles_on_complete_mission();
comment on function app_public.tg_pupcles_on_complete_mission() is
  E'Gives reward pupcles to the user when the user completes a mission';

create table app_public.mission_invites (
  from_user_id          uuid not null references app_public.users on delete cascade,
  to_user_id            uuid not null references app_public.users on delete cascade,
  mission_id            uuid not null references app_public.missions on delete cascade,
  primary key (from_user_id, to_user_id, mission_id),
  read                  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table app_public.mission_invites enable row level security;

create index on app_public.mission_invites (to_user_id);
create index on app_public.mission_invites (mission_id);
create index on app_public.mission_invites (created_at);

create policy select_from_me on app_public.mission_invites for select using (from_user_id = app_public.current_user_id());
create policy select_to_me on app_public.mission_invites for select using (to_user_id = app_public.current_user_id());
create policy insert_from_me_to_friend on app_public.mission_invites for insert with check (from_user_id = app_public.current_user_id() and to_user_id in (select app_public.current_user_shared_friend_ids()));
create policy update_to_me on app_public.mission_invites for update using (to_user_id = app_public.current_user_id());
create policy delete_from_me on app_public.mission_invites for delete using (from_user_id = app_public.current_user_id());
create policy delete_to_me on app_public.mission_invites for delete using (to_user_id = app_public.current_user_id());

grant select on app_public.mission_invites to :DATABASE_VISITOR;
grant insert(from_user_id, to_user_id, mission_id) on app_public.mission_invites to :DATABASE_VISITOR;
grant update(read) on app_public.mission_invites to :DATABASE_VISITOR;
grant delete on app_public.mission_invites to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.mission_invites
  for each row
  execute procedure app_private.tg__timestamps();
