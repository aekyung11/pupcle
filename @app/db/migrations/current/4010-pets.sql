-- create table app_public.pet_kind (
--   kind        text primary key,
--   description text
-- );

-- comment on table app_public.pet_kind is E'@enum';

-- insert into app_public.pet_kind (kind, description) values
--   ('DOG', 'Dog');

-- grant select on table app_public.pet_kind to :DATABASE_AUTHENTICATOR;

-- create table app_public.pet_gender (
--   gender      text primary key,
--   description text
-- );

-- comment on table app_public.pet_gender is E'@enum';

-- insert into app_public.pet_gender (gender, description) values
--   ('M', 'male'),
--   ('F', 'female');

-- grant select on table app_public.pet_gender to :DATABASE_AUTHENTICATOR;

-- create type app_public.weight_unit as enum (
--   'kg',
--   'lbs'
-- );

-- create type app_public.weight as (
--   unit  app_public.weight_unit,
--   value double precision
-- );

-- create table app_public.pets (
--   id            uuid primary key default gen_random_uuid(),
--   user_id       uuid not null references app_public.users on delete cascade,
--   kind          text not null references app_public.pet_kind,
--   name          text not null,
--   gender        text not null references app_public.pet_gender,
--   dob           date not null,
--   weight        app_public.weight,
--   neutered      boolean not null,
--   avatar_url    text check(avatar_url ~ '^https?://[^/]+'),
--   vaccinations  jsonb,
--   injections    jsonb,
--   created_at    timestamptz not null default now(),
--   updated_at    timestamptz not null default now()
-- );
-- alter table app_public.pets enable row level security;

-- -- create policy select_shared on app_public

-- -- TODO: trigger: when creating a pet, create basic_exam_categories for the defaults
