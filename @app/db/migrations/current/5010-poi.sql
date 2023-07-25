create table app_public.poi (
  id              uuid primary key default gen_random_uuid(),
  kakao_id        varchar(255) not null unique,
  rating          double precision not null,
  total_rating    integer not null,
  rating_count    integer not null,
  review_count    integer not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table app_public.poi enable row level security;

create policy select_all on app_public.poi for select using (true);

grant select on app_public.poi to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.poi
  for each row
  execute procedure app_private.tg__timestamps();

create table poi_reviews (
  -- always set by trigger
  poi_id          uuid references app_public.poi on delete cascade,
  user_id         uuid not null references app_public.users on delete cascade,
  primary key (user_id, poi_id),
  kakao_id        varchar(255) not null,
  comment         text,
  rating          integer not null check (rating >= 1 and rating <= 10),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table app_public.poi_reviews enable row level security;

create index on app_public.poi_reviews (kakao_id, user_id);
create index on app_public.poi_reviews (poi_id, user_id);
create index on app_public.poi_reviews (user_id);

create policy insert_own on app_public.poi_reviews for insert with check (user_id = app_public.current_user_id());
create policy update_own on app_public.poi_reviews for update using (user_id = app_public.current_user_id());
create policy delete_own on app_public.poi_reviews for delete using (user_id = app_public.current_user_id());

create policy select_all on app_public.poi_reviews for select using (true);

grant select on app_public.poi_reviews to :DATABASE_VISITOR;
grant insert (
  kakao_id,
  poi_id,
  user_id,
  comment,
  rating
) on app_public.poi_reviews to :DATABASE_VISITOR;
grant update (
  kakao_id,
  poi_id,
  user_id,
  comment,
  rating
) on app_public.poi_reviews to :DATABASE_VISITOR;
grant delete on app_public.poi_reviews to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.poi_reviews
  for each row
  execute procedure app_private.tg__timestamps();

create or replace function app_public.tg__poi_related__create_poi()
returns trigger as $$
begin
  if NEW.poi_id = '00000000-0000-0000-0000-000000000000' then
    NEW.poi_id := null;
  end if;

  if NEW.poi_id is null then
    select id
    into NEW.poi_id
    from app_public.poi where kakao_id = NEW.kakao_id;
  end if;

  if NEW.poi_id is null then
    NEW.poi_id := gen_random_uuid();
  end if;

  insert into app_public.poi(id, kakao_id, rating, total_rating, rating_count, review_count) values(NEW.poi_id, NEW.kakao_id, 0, 0, 0, 0) on conflict do nothing;
  return NEW;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

create trigger _200_poi_reviews_create_poi
  before insert on app_public.poi_reviews
  for each row
  execute procedure app_public.tg__poi_related__create_poi();
comment on function app_public.tg__poi_related__create_poi() is
  E'Inserts a poi for this poi related object';

create or replace function app_public.tg__poi_reviews__check_kakao_id()
returns trigger as $$
begin
  if NEW.kakao_id <> OLD.kakao_id then
    raise exception 'cannot change kakao_id';
  end if;

  if NEW.poi_id <> OLD.poi_id then
    raise exception 'cannot change poi_id';
  end if;
  return new;
end;
$$ language plpgsql volatile set search_path to pg_catalog, public, pg_temp;

create trigger _300_poi_reviews_check_kakao_id
  before update on app_public.poi_reviews
  for each row
  execute procedure app_public.tg__poi_reviews__check_kakao_id();
comment on function app_public.tg__poi_reviews__check_kakao_id() is
  E'Checks that the kakao id is not changing on a poi review';

create or replace function app_public.tg__poi_reviews__update_poi_on_review() returns trigger as $$
declare
  v_poi_id uuid;
  v_kakao_id varchar(255);
  v_rating double precision;
  v_total_rating integer;
  v_rating_count integer;
  v_review_count integer;
begin
  if tg_op = 'UPDATE' or tg_op = 'INSERT' then
    v_poi_id := NEW.poi_id;
    v_kakao_id := NEW.kakao_id;
  elsif tg_op = 'DELETE' then
    v_poi_id := OLD.poi_id;
    v_kakao_id := OLD.kakao_id;
  end if;

  select rating, total_rating, rating_count, review_count
    into v_rating, v_total_rating, v_rating_count, v_review_count
    from app_public.poi where id = v_poi_id;

  if tg_op = 'UPDATE' then
    v_total_rating := v_total_rating + NEW.rating - OLD.rating;
    v_rating := cast(v_total_rating as double precision) / v_rating_count;
  end if;

  if tg_op = 'INSERT' then
    v_total_rating := v_total_rating + NEW.rating;
    v_rating_count := v_rating_count + 1;
    v_rating := cast(v_total_rating as double precision) / v_rating_count;
  end if;

  if tg_op = 'DELETE' then
    v_total_rating := v_total_rating - coalesce(OLD.rating, 0);
    v_rating_count := v_rating_count - 1;
    if v_rating_count = 0 then
      v_rating := 0;
    else
      v_rating := cast(v_total_rating as double precision) / v_rating_count;
    end if;
  end if;

  if NEW.comment is not null and (tg_op = 'INSERT' or (tg_op = 'UPDATE' and OLD.comment is null)) then
    v_review_count := v_review_count + 1;
  end if;

  if NEW.comment is null and tg_op = 'UPDATE' and OLD.comment is not null then
    v_review_count := v_review_count - 1;
  end if;

  if tg_op = 'DELETE' and OLD.comment is not null then
    v_review_count := v_review_count - 1;
  end if;

  insert into app_public.poi (id, kakao_id, rating, total_rating, rating_count, review_count)
  values (v_poi_id, v_kakao_id, v_rating, v_total_rating, v_rating_count, v_review_count)
  on conflict (id) do update
  set rating = EXCLUDED.rating,
    total_rating = EXCLUDED.total_rating,
    rating_count = EXCLUDED.rating_count,
    review_count = EXCLUDED.review_count;

  return NEW;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

create trigger _400_poi_reviews_after_change
  after insert or update or delete
  on app_public.poi_reviews
  for each row
  execute procedure app_public.tg__poi_reviews__update_poi_on_review();
comment on function app_public.tg__poi_reviews__update_poi_on_review() is
  E'Updates a poi''s rating and reviews aggregates when a poi review is inserted or updated.';
