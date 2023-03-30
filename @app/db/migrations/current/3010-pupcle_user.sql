create table app_public.user_entries (
  user_id                               uuid not null primary key references app_public.users on delete cascade,
  pupcle_balance                        int not null default 0,
  total_pupcles_earned                  int not null default 0,
  address                               jsonb,
  agreed_to_terms                       boolean not null default false,
  receive_general_notifications         boolean not null default true,
  receive_marketing_notifications       boolean not null default true,
  receive_personal_notifications        boolean not null default true,
  receive_friend_request_notifications  boolean not null default true,
  receive_invite_notifications          boolean not null default true,
  created_at                            timestamptz not null default now(),
  updated_at                            timestamptz not null default now()
);
alter table app_public.user_entries enable row level security;

create policy select_own on app_public.user_entries for select using (user_id = app_public.current_user_id());
create policy update_own on app_public.user_entries for update using (user_id = app_public.current_user_id());
grant select on app_public.user_entries to :DATABASE_VISITOR;
-- NOTE: `insert` is not granted, because we'll handle that separately
grant update(
  address,
  agreed_to_terms,
  receive_general_notifications,
  receive_marketing_notifications,
  receive_personal_notifications,
  receive_friend_request_notifications,
  receive_invite_notifications
) on app_public.user_entries to :DATABASE_VISITOR;
-- NOTE: `delete` is not granted, because we require confirmation via request_account_deletion/confirm_account_deletion

-- TODO(Aekyung): add comments

create trigger _100_timestamps
  before insert or update on app_public.user_entries
  for each row
  execute procedure app_private.tg__timestamps();

/*
 * When we insert into `users` we _always_ want there to be a matching
 * `user_entries` entry, so we have a trigger to enforce this:
 */
create function app_public.tg_user_entries__insert_with_user() returns trigger as $$
begin
  insert into app_public.user_entries(user_id) values(NEW.id) on conflict do nothing;
  return NEW;
end;
$$ language plpgsql volatile set search_path to pg_catalog, public, pg_temp;
create trigger _550_insert_entries
  after insert on app_public.users
  for each row
  execute procedure app_public.tg_user_entries__insert_with_user();
comment on function app_public.tg_user_entries__insert_with_user() is
  E'Ensures that every user record has an associated user_entries record.';
