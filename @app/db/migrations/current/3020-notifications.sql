create table notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references app_public.users on delete cascade,
  category        text not null,
  message         text not null,
  read            boolean not null default false,
  expires_at      timestamptz,
  action_url      text check(action_url ~ '^https?://[^/]+'),
  -- kind: "personal", "general"
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table app_public.notifications enable row level security;

-- cleanup trigger? on creation of notification in the database table, also create a new job scheduled for 2 weeks from now to delete the notification

create index on app_public.notifications (created_at, user_id, read);
create index on app_public.notifications (user_id, read);

create policy select_own on app_public.notifications for select using (user_id = app_public.current_user_id());

grant select on app_public.notifications to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.notifications
  for each row
  execute procedure app_private.tg__timestamps();
