--! Previous: -
--! Hash: sha1:3a9a29b47ee27b8230d58b07b29d335372e31f85

--! split: 0001-reset.sql
/*
 * Graphile Migrate will run our `current/...` migrations in one batch. Since
 * this is our first migration it's defining the entire database, so we first
 * drop anything that may have previously been created
 * (app_public/app_hidden/app_private) so that we can start from scratch.
 */

drop schema if exists app_public cascade;
drop schema if exists app_hidden cascade;
drop schema if exists app_private cascade;

--! split: 0010-public-permissions.sql
/*
 * The `public` *schema* contains things like PostgreSQL extensions. We
 * deliberately do not install application logic into the public schema
 * (instead storing it to app_public/app_hidden/app_private as appropriate),
 * but none the less we don't want untrusted roles to be able to install or
 * modify things into the public schema.
 *
 * The `public` *role* is automatically inherited by all other roles; we only
 * want specific roles to be able to access our database so we must revoke
 * access to the `public` role.
 */

revoke all on schema public from public;

alter default privileges revoke all on sequences from public;
alter default privileges revoke all on functions from public;

-- Of course we want our database owner to be able to do anything inside the
-- database, so we grant access to the `public` schema:
grant all on schema public to :DATABASE_OWNER;

--! split: 0020-schemas.sql
/*
 * Read about our app_public/app_hidden/app_private schemas here:
 * https://www.graphile.org/postgraphile/namespaces/#advice
 *
 * Note this pattern is not required to use PostGraphile, it's merely the
 * preference of the author of this package.
 */

create schema app_public;
create schema app_hidden;
create schema app_private;

-- The 'visitor' role (used by PostGraphile to represent an end user) may
-- access the public, app_public and app_hidden schemas (but _NOT_ the
-- app_private schema).
grant usage on schema public, app_public, app_hidden to :DATABASE_VISITOR;

-- We want the `visitor` role to be able to insert rows (`serial` data type
-- creates sequences, so we need to grant access to that).
alter default privileges in schema public, app_public, app_hidden
  grant usage, select on sequences to :DATABASE_VISITOR;

-- And the `visitor` role should be able to call functions too.
alter default privileges in schema public, app_public, app_hidden
  grant execute on functions to :DATABASE_VISITOR;

--! split: 0030-common-triggers.sql
/*
 * These triggers are commonly used across many tables.
 */

-- Used for queueing jobs easily; relies on the fact that every table we have
-- has a primary key 'id' column; this won't work if you rename your primary
-- key columns.
create function app_private.tg__add_job() returns trigger as $$
begin
  perform graphile_worker.add_job(tg_argv[0], json_build_object('id', NEW.id));
  return NEW;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;
comment on function app_private.tg__add_job() is
  E'Useful shortcut to create a job on insert/update. Pass the task name as the first trigger argument, and optionally the queue name as the second argument. The record id will automatically be available on the JSON payload.';

-- This trigger is used to queue a job to inform a user that a significant
-- security change has been made to their account (e.g. adding a new email
-- address, linking a new social login).
create function app_private.tg__add_audit_job() returns trigger as $$
declare
  v_user_id uuid;
  v_type text = TG_ARGV[0];
  v_user_id_attribute text = TG_ARGV[1];
  v_extra_attribute1 text = TG_ARGV[2];
  v_extra_attribute2 text = TG_ARGV[3];
  v_extra_attribute3 text = TG_ARGV[4];
  v_extra1 text;
  v_extra2 text;
  v_extra3 text;
begin
  if v_user_id_attribute is null then
    raise exception 'Invalid tg__add_audit_job call';
  end if;

  execute 'select ($1.' || quote_ident(v_user_id_attribute) || ')::uuid'
    using (case when TG_OP = 'INSERT' then NEW else OLD end)
    into v_user_id;

  if v_extra_attribute1 is not null then
    execute 'select ($1.' || quote_ident(v_extra_attribute1) || ')::text'
      using (case when TG_OP = 'DELETE' then OLD else NEW end)
      into v_extra1;
  end if;
  if v_extra_attribute2 is not null then
    execute 'select ($1.' || quote_ident(v_extra_attribute2) || ')::text'
      using (case when TG_OP = 'DELETE' then OLD else NEW end)
      into v_extra2;
  end if;
  if v_extra_attribute3 is not null then
    execute 'select ($1.' || quote_ident(v_extra_attribute3) || ')::text'
      using (case when TG_OP = 'DELETE' then OLD else NEW end)
      into v_extra3;
  end if;

  if v_user_id is not null then
    perform graphile_worker.add_job(
      'user__audit',
      json_build_object(
        'type', v_type,
        'user_id', v_user_id,
        'extra1', v_extra1,
        'extra2', v_extra2,
        'extra3', v_extra3,
        'current_user_id', app_public.current_user_id(),
        'schema', TG_TABLE_SCHEMA,
        'table', TG_TABLE_NAME
      ));
  end if;

  return NEW;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;
comment on function app_private.tg__add_audit_job() is
  E'For notifying a user that an auditable action has taken place. Call with audit event name, user ID attribute name, and optionally another value to be included (e.g. the PK of the table, or some other relevant information). e.g. `tg__add_audit_job(''added_email'', ''user_id'', ''email'')`';

/*
 * This trigger is used on tables with created_at and updated_at to ensure that
 * these timestamps are kept valid (namely: `created_at` cannot be changed, and
 * `updated_at` must be monotonically increasing).
 */
create function app_private.tg__timestamps() returns trigger as $$
begin
  NEW.created_at = (case when TG_OP = 'INSERT' then NOW() else OLD.created_at end);
  NEW.updated_at = (case when TG_OP = 'UPDATE' and OLD.updated_at >= NOW() then OLD.updated_at + interval '1 millisecond' else NOW() end);
  return NEW;
end;
$$ language plpgsql volatile set search_path to pg_catalog, public, pg_temp;
comment on function app_private.tg__timestamps() is
  E'This trigger should be called on all tables with created_at, updated_at - it ensures that they cannot be manipulated and that updated_at will always be larger than the previous updated_at.';

/*
 * This trigger is useful for adding realtime features to our GraphQL schema
 * with minimal effort in the database. It's a very generic trigger function;
 * you're intended to pass three arguments when you call it:
 *
 * 1. The "event" name to include, this is an arbitrary string.
 * 2. The "topic" template that we'll be publishing the event to. A `$1` in
 *    this may be added as a placeholder which will be replaced by the
 *    "subject" value.
 * 3. The "subject" column, we'll read the value of this column from the NEW
 *    (for insert/update) or OLD (for delete) record and include it in the
 *    event payload.
 *
 * A PostgreSQL `NOTIFY` will be issued to the topic (or "channel") generated
 * from arguments 2 and 3, the body of the notification will be a stringified
 * JSON object containing `event`, `sub` (the subject specified by argument 3)
 * and `id` (the record id).
 *
 * Example:
 *
 *     create trigger _500_gql_update
 *       after update on app_public.users
 *       for each row
 *       execute procedure app_public.tg__graphql_subscription(
 *         'userChanged', -- the "event" string, useful for the client to know what happened
 *         'graphql:user:$1', -- the "topic" the event will be published to, as a template
 *         'id' -- If specified, `$1` above will be replaced with NEW.id or OLD.id from the trigger.
 *       );
 */
create function app_public.tg__graphql_subscription() returns trigger as $$
declare
  v_process_new bool = (TG_OP = 'INSERT' OR TG_OP = 'UPDATE');
  v_process_old bool = (TG_OP = 'UPDATE' OR TG_OP = 'DELETE');
  v_event text = TG_ARGV[0];
  v_topic_template text = TG_ARGV[1];
  v_attribute text = TG_ARGV[2];
  v_record record;
  v_sub text;
  v_topic text;
  v_i int = 0;
  v_last_topic text;
begin
  for v_i in 0..1 loop
    if (v_i = 0) and v_process_new is true then
      v_record = new;
    elsif (v_i = 1) and v_process_old is true then
      v_record = old;
    else
      continue;
    end if;
     if v_attribute is not null then
      execute 'select $1.' || quote_ident(v_attribute)
        using v_record
        into v_sub;
    end if;
    if v_sub is not null then
      v_topic = replace(v_topic_template, '$1', v_sub);
    else
      v_topic = v_topic_template;
    end if;
    if v_topic is distinct from v_last_topic then
      -- This if statement prevents us from triggering the same notification twice
      v_last_topic = v_topic;
      perform pg_notify(v_topic, json_build_object(
        'event', v_event,
        'subject', v_sub,
        'id', v_record.id
      )::text);
    end if;
  end loop;
  return v_record;
end;
$$ language plpgsql volatile;
comment on function app_public.tg__graphql_subscription() is
  E'This function enables the creation of simple focussed GraphQL subscriptions using database triggers. Read more here: https://www.graphile.org/postgraphile/subscriptions/#custom-subscriptions';

--! split: 0040-pg-sessions-table.sql
/*
 * This table is used (only) by `connect-pg-simple` (see `installSession.ts`)
 * to track cookie session information at the webserver (`express`) level if
 * you don't have a redis server. If you're using redis everywhere (including
 * development) then you don't need this table.
 *
 * Do not confuse this with the `app_private.sessions` table.
 */

create table app_private.connect_pg_simple_sessions (
  sid varchar not null,
	sess json not null,
	expire timestamp not null
);
alter table app_private.connect_pg_simple_sessions
  enable row level security;
alter table app_private.connect_pg_simple_sessions
  add constraint session_pkey primary key (sid) not deferrable initially immediate;

--! split: 1000-sessions.sql
/*
 * The sessions table is used to track who is logged in, if there are any
 * restrictions on that session, when it was last active (so we know if it's
 * still valid), etc.
 *
 * In Starter we only have an extremely limited implementation of this, but you
 * could add things like "last_auth_at" to it so that you could track when they
 * last officially authenticated; that way if you have particularly dangerous
 * actions you could require them to log back in to allow them to perform those
 * actions. (GitHub does this when you attempt to change the settings on a
 * repository, for example.)
 *
 * The primary key is a cryptographically secure random uuid; the value of this
 * primary key should be secret, and only shared with the user themself. We
 * currently wrap this session in a webserver-level session (either using
 * redis, or using `connect-pg-simple` which uses the
 * `connect_pg_simple_sessions` table which we defined previously) so that we
 * don't even send the raw session id to the end user, but you might want to
 * consider exposing it for things such as mobile apps or command line
 * utilities that may not want to implement cookies to maintain a cookie
 * session.
 */

create table app_private.sessions (
  uuid uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  -- You could add access restriction columns here if you want, e.g. for OAuth scopes.
  created_at timestamptz not null default now(),
  last_active timestamptz not null default now()
);
alter table app_private.sessions enable row level security;

-- To allow us to efficiently see what sessions are open for a particular user.
create index on app_private.sessions (user_id);

--! split: 1010-session-functions.sql
/*
 * This function is responsible for reading the `jwt.claims.session_id`
 * transaction setting (set from the `pgSettings` function within
 * `installPostGraphile.ts`). Defining this inside a function means we can
 * modify it in future to allow additional ways of defining the session.
 */

-- Note we have this in `app_public` but it doesn't show up in the GraphQL
-- schema because we've used `postgraphile.tags.jsonc` to omit it. We could
-- have put it in app_hidden to get the same effect more easily, but it's often
-- useful to un-omit it to ease debugging auth issues.
create function app_public.current_session_id() returns uuid as $$
  select nullif(pg_catalog.current_setting('jwt.claims.session_id', true), '')::uuid;
$$ language sql stable;
comment on function app_public.current_session_id() is
  E'Handy method to get the current session ID.';


/*
 * We can figure out who the current user is by looking up their session in the
 * sessions table using the `current_session_id()` function.
 *
 * A less secure but more performant version of this function might contain only:
 *
 *   select nullif(pg_catalog.current_setting('jwt.claims.user_id', true), '')::uuid;
 *
 * The increased security of this implementation is because even if someone gets
 * the ability to run SQL within this transaction they cannot impersonate
 * another user without knowing their session_id (which should be closely
 * guarded).
 *
 * The below implementation is more secure than simply indicating the user_id
 * directly: even if an SQL injection vulnerability were to allow a user to set
 * their `jwt.claims.session_id` to another value, it would take them many
 * millenia to be able to correctly guess someone else's session id (since it's
 * a cryptographically secure random value that is kept secret). This makes
 * impersonating another user virtually impossible.
 */
create function app_public.current_user_id() returns uuid as $$
  select user_id from app_private.sessions where uuid = app_public.current_session_id();
$$ language sql stable security definer set search_path to pg_catalog, public, pg_temp;
comment on function app_public.current_user_id() is
  E'Handy method to get the current user ID for use in RLS policies, etc; in GraphQL, use `currentUser{id}` instead.';

--! split: 1020-users.sql
/*
 * The users table stores (unsurprisingly) the users of our application. You'll
 * notice that it does NOT contain private information such as the user's
 * password or their email address; that's because the users table is seen as
 * public - anyone who can "see" the user can see this information.
 *
 * The author sees `is_admin` and `is_verified` as public information; if you
 * disagree then you should relocate these attributes to another table, such as
 * `user_secrets`.
 */
create table app_public.users (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique check(length(username) >= 2 and length(username) <= 24 and username ~ '^[a-zA-Z]([_]?[a-zA-Z0-9])+$'),
  nickname text,
  avatar_url text check(avatar_url ~ '^https?://[^/]+'),
  is_admin boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table app_public.users enable row level security;

-- We couldn't implement this relationship on the sessions table until the users table existed!
alter table app_private.sessions
  add constraint sessions_user_id_fkey
  foreign key ("user_id") references app_public.users on delete cascade;

-- Users are publicly visible, like on GitHub, Twitter, Facebook, Trello, etc.
create policy select_all on app_public.users for select using (true);
-- You can only update yourself.
create policy update_self on app_public.users for update using (id = app_public.current_user_id());
grant select on app_public.users to :DATABASE_VISITOR;
-- NOTE: `insert` is not granted, because we'll handle that separately
grant update(username, nickname, avatar_url) on app_public.users to :DATABASE_VISITOR;
-- NOTE: `delete` is not granted, because we require confirmation via request_account_deletion/confirm_account_deletion

comment on table app_public.users is
  E'A user who can log in to the application.';

comment on column app_public.users.id is
  E'Unique identifier for the user.';
comment on column app_public.users.username is
  E'Public-facing username (or ''handle'') of the user.';
comment on column app_public.users.nickname is
  E'Public-facing nickname (or pseudonym) of the user.';
comment on column app_public.users.avatar_url is
  E'Optional avatar URL.';
comment on column app_public.users.is_admin is
  E'If true, the user has elevated privileges.';

create trigger _100_timestamps
  before insert or update on app_public.users
  for each row
  execute procedure app_private.tg__timestamps();

/**********/

-- Returns the current user; this is a "custom query" function; see:
-- https://www.graphile.org/postgraphile/custom-queries/
-- So this will be queryable via GraphQL as `{ currentUser { ... } }`
create function app_public.current_user() returns app_public.users as $$
  select users.* from app_public.users where id = app_public.current_user_id();
$$ language sql stable;
comment on function app_public.current_user() is
  E'The currently logged in user (or null if not logged in).';

/**********/

-- The users table contains all the public information, but we need somewhere
-- to store private information. In fact, this data is so private that we don't
-- want the user themselves to be able to see it - things like the bcrypted
-- password hash, timestamps of recent login attempts (to allow us to
-- auto-protect user accounts that are under attack), etc.
create table app_private.user_secrets (
  user_id uuid not null primary key references app_public.users on delete cascade,
  password_hash text,
  last_login_at timestamptz not null default now(),
  failed_password_attempts int not null default 0,
  first_failed_password_attempt timestamptz,
  reset_password_token text,
  reset_password_token_generated timestamptz,
  failed_reset_password_attempts int not null default 0,
  first_failed_reset_password_attempt timestamptz,
  delete_account_token text,
  delete_account_token_generated timestamptz
);
alter table app_private.user_secrets enable row level security;
comment on table app_private.user_secrets is
  E'The contents of this table should never be visible to the user. Contains data mostly related to authentication.';

/*
 * When we insert into `users` we _always_ want there to be a matching
 * `user_secrets` entry, so we have a trigger to enforce this:
 */
create function app_private.tg_user_secrets__insert_with_user() returns trigger as $$
begin
  insert into app_private.user_secrets(user_id) values(NEW.id);
  return NEW;
end;
$$ language plpgsql volatile set search_path to pg_catalog, public, pg_temp;
create trigger _500_insert_secrets
  after insert on app_public.users
  for each row
  execute procedure app_private.tg_user_secrets__insert_with_user();
comment on function app_private.tg_user_secrets__insert_with_user() is
  E'Ensures that every user record has an associated user_secret record.';

/*
 * Because you can register with username/password or using OAuth (social
 * login), we need a way to tell the user whether or not they have a
 * password. This is to help the UI display the right interface: change
 * password or set password.
 */
create function app_public.users_has_password(u app_public.users) returns boolean as $$
  select (password_hash is not null) from app_private.user_secrets where user_secrets.user_id = u.id and u.id = app_public.current_user_id();
$$ language sql stable security definer set search_path to pg_catalog, public, pg_temp;

/*
 * When the user validates their email address we want the UI to be notified
 * immediately, so we'll issue a notification to the `graphql:user:*` topic
 * which GraphQL users can subscribe to via the `currentUserUpdated`
 * subscription field.
 */
create trigger _500_gql_update
  after update on app_public.users
  for each row
  execute procedure app_public.tg__graphql_subscription(
    'userChanged', -- the "event" string, useful for the client to know what happened
    'graphql:user:$1', -- the "topic" the event will be published to, as a template
    'id' -- If specified, `$1` above will be replaced with NEW.id or OLD.id from the trigger.
  );

--! split: 1030-user_emails.sql
/*
 * A user may have more than one email address; this is useful when letting the
 * user change their email so that they can verify the new one before deleting
 * the old one, but is also generally useful as they might want to use
 * different emails to log in versus where to send notifications. Therefore we
 * track user emails in a separate table.
 */
create table app_public.user_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default app_public.current_user_id() references app_public.users on delete cascade,
  email citext not null check (email ~ '[^@]+@[^@]+\.[^@]+'),
  is_verified boolean not null default false,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Each user can only have an email once.
  constraint user_emails_user_id_email_key unique(user_id, email),
  -- An unverified email cannot be set as the primary email.
  constraint user_emails_must_be_verified_to_be_primary check(is_primary is false or is_verified is true)
);
alter table app_public.user_emails enable row level security;

-- Once an email is verified, it may only be used by one user. (We can't
-- enforce this before an email is verified otherwise it could be used to
-- prevent a legitimate user from signing up.)
create unique index uniq_user_emails_verified_email on app_public.user_emails(email) where (is_verified is true);
-- Only one primary email per user.
create unique index uniq_user_emails_primary_email on app_public.user_emails (user_id) where (is_primary is true);
-- Allow efficient retrieval of all the emails owned by a particular user.
create index idx_user_emails_user on app_public.user_emails (user_id);
-- For the user settings page sorting
create index idx_user_emails_primary on app_public.user_emails (is_primary, user_id);

-- Keep created_at and updated_at up to date.
create trigger _100_timestamps
  before insert or update on app_public.user_emails
  for each row
  execute procedure app_private.tg__timestamps();

-- When an email address is added to a user, notify them (in case their account was compromised).
create trigger _500_audit_added
  after insert on app_public.user_emails
  for each row
  execute procedure app_private.tg__add_audit_job(
    'added_email',
    'user_id',
    'id',
    'email'
  );

-- When an email address is removed from a user, notify them (in case their account was compromised).
create trigger _500_audit_removed
  after delete on app_public.user_emails
  for each row
  execute procedure app_private.tg__add_audit_job(
    'removed_email',
    'user_id',
    'id',
    'email'
  );

-- You can't verify an email address that someone else has already verified. (Email is taken.)
create function app_public.tg_user_emails__forbid_if_verified() returns trigger as $$
begin
  if exists(select 1 from app_public.user_emails where email = NEW.email and is_verified is true) then
    raise exception 'An account using that email address has already been created.' using errcode='EMTKN';
  end if;
  return NEW;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;
create trigger _200_forbid_existing_email before insert on app_public.user_emails for each row execute procedure app_public.tg_user_emails__forbid_if_verified();

-- If the email wasn't already verified (e.g. via a social login provider) then
-- queue up the verification email to be sent.
create trigger _900_send_verification_email
  after insert on app_public.user_emails
  for each row
  when (NEW.is_verified is false)
  execute procedure app_private.tg__add_job('user_emails__send_verification');

comment on table app_public.user_emails is
  E'Information about a user''s email address.';
comment on column app_public.user_emails.email is
  E'The users email address, in `a@b.c` format.';
comment on column app_public.user_emails.is_verified is
  E'True if the user has is_verified their email address (by clicking the link in the email we sent them, or logging in with a social login provider), false otherwise.';

-- Users may only manage their own emails.
create policy select_own on app_public.user_emails for select using (user_id = app_public.current_user_id());
create policy insert_own on app_public.user_emails for insert with check (user_id = app_public.current_user_id());
-- NOTE: we don't allow emails to be updated, instead add a new email and delete the old one.
create policy delete_own on app_public.user_emails for delete using (user_id = app_public.current_user_id());

grant select on app_public.user_emails to :DATABASE_VISITOR;
grant insert (email) on app_public.user_emails to :DATABASE_VISITOR;
-- No update
grant delete on app_public.user_emails to :DATABASE_VISITOR;

-- Prevent deleting the user's last email, otherwise they can't access password reset/etc.
create function app_public.tg_user_emails__prevent_delete_last_email() returns trigger as $$
begin
  if exists (
    with remaining as (
      select user_emails.user_id
      from app_public.user_emails
      inner join deleted
      on user_emails.user_id = deleted.user_id
      -- Don't delete last verified email
      where (user_emails.is_verified is true or not exists (
        select 1
        from deleted d2
        where d2.user_id = user_emails.user_id
        and d2.is_verified is true
      ))
      order by user_emails.id asc

      /*
       * Lock this table to prevent race conditions; see:
       * https://www.cybertec-postgresql.com/en/triggers-to-enforce-constraints/
       */
      for update of user_emails
    )
    select 1
    from app_public.users
    where id in (
      select user_id from deleted
      except
      select user_id from remaining
    )
  )
  then
    raise exception 'You must have at least one (verified) email address' using errcode = 'CDLEA';
  end if;

  return null;
end;
$$
language plpgsql
-- Security definer is required for 'FOR UPDATE OF' since we don't grant UPDATE privileges.
security definer
set search_path = pg_catalog, public, pg_temp;

-- Note this check runs AFTER the email was deleted. If the user was deleted
-- then their emails will also be deleted (thanks to the foreign key on delete
-- cascade) and this is desirable; we only want to prevent the deletion if
-- the user still exists so we check after the statement completes.
create trigger _500_prevent_delete_last
  after delete on app_public.user_emails
  referencing old table as deleted
  for each statement
  execute procedure app_public.tg_user_emails__prevent_delete_last_email();

/**********/

/*
 * Just like with users and user_secrets, there are secrets for emails that we
 * don't want the user to be able to see - for example the verification token.
 * Like with user_secrets we automatically create a record in this table
 * whenever a record is added to user_emails.
 */
create table app_private.user_email_secrets (
  user_email_id uuid primary key references app_public.user_emails on delete cascade,
  verification_token text,
  verification_email_sent_at timestamptz,
  password_reset_email_sent_at timestamptz
);
alter table app_private.user_email_secrets enable row level security;

comment on table app_private.user_email_secrets is
  E'The contents of this table should never be visible to the user. Contains data mostly related to email verification and avoiding spamming users.';
comment on column app_private.user_email_secrets.password_reset_email_sent_at is
  E'We store the time the last password reset was sent to this email to prevent the email getting flooded.';

create function app_private.tg_user_email_secrets__insert_with_user_email() returns trigger as $$
declare
  v_verification_token text;
begin
  if NEW.is_verified is false then
    v_verification_token = encode(gen_random_bytes(7), 'hex');
  end if;
  insert into app_private.user_email_secrets(user_email_id, verification_token) values(NEW.id, v_verification_token);
  return NEW;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;
create trigger _500_insert_secrets
  after insert on app_public.user_emails
  for each row
  execute procedure app_private.tg_user_email_secrets__insert_with_user_email();
comment on function app_private.tg_user_email_secrets__insert_with_user_email() is
  E'Ensures that every user_email record has an associated user_email_secret record.';

/**********/

/*
 * When the user receives the email verification message it will contain the
 * token; this function is responsible for checking the token and marking the
 * email as verified if it matches. Note it is a `SECURITY DEFINER` function,
 * which means it runs with the security of the user that defined the function
 * (which is the database owner) - i.e. it can do anything the database owner
 * can do. This means we have to be very careful what we put in the function,
 * and make sure that it checks that the user is allowed to do what they're
 * trying to do - in this case, we do that check by ensuring the token matches.
 */
create function app_public.verify_email(user_email_id uuid, token text) returns boolean as $$
begin
  update app_public.user_emails
  set
    is_verified = true,
    is_primary = is_primary or not exists(
      select 1 from app_public.user_emails other_email where other_email.user_id = user_emails.user_id and other_email.is_primary is true
    )
  where id = user_email_id
  and exists(
    select 1 from app_private.user_email_secrets where user_email_secrets.user_email_id = user_emails.id and verification_token = token
  );
  return found;
end;
$$ language plpgsql strict volatile security definer set search_path to pg_catalog, public, pg_temp;
comment on function app_public.verify_email(user_email_id uuid, token text) is
  E'Once you have received a verification token for your email, you may call this mutation with that token to make your email verified.';

/*
 * When the users first email address is verified we will mark their account as
 * verified, which can unlock additional features that were gated behind an
 * `isVerified` check.
 */

create function app_public.tg_user_emails__verify_account_on_verified() returns trigger as $$
begin
  update app_public.users set is_verified = true where id = new.user_id and is_verified is false;
  return new;
end;
$$ language plpgsql strict volatile security definer set search_path to pg_catalog, public, pg_temp;

create trigger _500_verify_account_on_verified
  after insert or update of is_verified
  on app_public.user_emails
  for each row
  when (new.is_verified is true)
  execute procedure app_public.tg_user_emails__verify_account_on_verified();

--! split: 1040-user_authentications.sql
/*
 * In addition to logging in with username/email and password, users may use
 * other authentication methods, such as "social login" (OAuth) with GitHub,
 * Twitter, Facebook, etc. We store details of these logins to the
 * user_authentications and user_authentication_secrets tables.
 *
 * The user is allowed to delete entries in this table (which will unlink them
 * from that service), but adding records to the table requires elevated
 * privileges (it's managed by the `installPassportStrategy.ts` middleware,
 * which calls out to the `app_private.link_or_register_user` database
 * function).
 */
create table app_public.user_authentications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_public.users on delete cascade,
  service text not null,
  identifier text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uniq_user_authentications unique(service, identifier)
);

alter table app_public.user_authentications enable row level security;

-- Make it efficient to find all the authentications for a particular user.
create index on app_public.user_authentications(user_id);

-- Keep created_at and updated_at up to date.
create trigger _100_timestamps
  before insert or update on app_public.user_authentications
  for each row
  execute procedure app_private.tg__timestamps();

comment on table app_public.user_authentications is
  E'Contains information about the login providers this user has used, so that they may disconnect them should they wish.';
comment on column app_public.user_authentications.service is
  E'The login service used, e.g. `twitter` or `github`.';
comment on column app_public.user_authentications.identifier is
  E'A unique identifier for the user within the login service.';
comment on column app_public.user_authentications.details is
  E'Additional profile details extracted from this login method';

-- Users may view and delete their social logins.
create policy select_own on app_public.user_authentications for select using (user_id = app_public.current_user_id());
create policy delete_own on app_public.user_authentications for delete using (user_id = app_public.current_user_id());
-- TODO: on delete, check this isn't the last one, or that they have a verified
-- email address or password. For now we're not worrying about that since all
-- the OAuth providers we use verify the email address.

-- Notify the user if a social login is removed.
create trigger _500_audit_removed
  after delete on app_public.user_authentications
  for each row
  execute procedure app_private.tg__add_audit_job(
    'unlinked_account',
    'user_id',
    'service',
    'identifier'
  );
-- NOTE: we don't need to notify when a linked account is added here because
-- that's handled in the link_or_register_user function.

grant select on app_public.user_authentications to :DATABASE_VISITOR;
grant delete on app_public.user_authentications to :DATABASE_VISITOR;

/**********/

-- This table contains secret information for each user_authentication; could
-- be things like access tokens, refresh tokens, profile information. Whatever
-- the passport strategy deems necessary.
create table app_private.user_authentication_secrets (
  user_authentication_id uuid not null primary key references app_public.user_authentications on delete cascade,
  details jsonb not null default '{}'::jsonb
);
alter table app_private.user_authentication_secrets enable row level security;

-- NOTE: user_authentication_secrets doesn't need an auto-inserter as we handle
-- that everywhere that can create a user_authentication row.

--! split: 1100-login.sql
/*
 * This function handles logging in a user with their username (or email
 * address) and password.
 *
 * Note that it is not in app_public; this function is intended to be called
 * with elevated privileges (namely from `PassportLoginPlugin.ts`). The reason
 * for this is because we want to be able to track failed login attempts (to
 * help protect user accounts). If this were callable by a user, they could
 * roll back the transaction when a login fails and no failed attempts would be
 * logged, effectively giving them infinite retries. We want to disallow this,
 * so we only let code call into `login` that we trust to not roll back the
 * transaction afterwards.
 */
create function app_private.login(username citext, password text) returns app_private.sessions as $$
declare
  v_user app_public.users;
  v_user_secret app_private.user_secrets;
  v_login_attempt_window_duration interval = interval '5 minutes';
  v_session app_private.sessions;
begin
  if username like '%@%' then
    -- It's an email
    select users.* into v_user
    from app_public.users
    inner join app_public.user_emails
    on (user_emails.user_id = users.id)
    where user_emails.email = login.username
    order by
      user_emails.is_verified desc, -- Prefer verified email
      user_emails.created_at asc -- Failing that, prefer the first registered (unverified users _should_ verify before logging in)
    limit 1;
  else
    -- It's a username
    select users.* into v_user
    from app_public.users
    where users.username = login.username;
  end if;

  if not (v_user is null) then
    -- Load their secrets
    select * into v_user_secret from app_private.user_secrets
    where user_secrets.user_id = v_user.id;

    -- Have there been too many login attempts?
    if (
      v_user_secret.first_failed_password_attempt is not null
    and
      v_user_secret.first_failed_password_attempt > NOW() - v_login_attempt_window_duration
    and
      v_user_secret.failed_password_attempts >= 3
    ) then
      raise exception 'User account locked - too many login attempts. Try again after 5 minutes.' using errcode = 'LOCKD';
    end if;

    -- Not too many login attempts, let's check the password.
    -- NOTE: `password_hash` could be null, this is fine since `NULL = NULL` is null, and null is falsy.
    if v_user_secret.password_hash = crypt(password, v_user_secret.password_hash) then
      -- Excellent - they're logged in! Let's reset the attempt tracking
      update app_private.user_secrets
      set failed_password_attempts = 0, first_failed_password_attempt = null, last_login_at = now()
      where user_id = v_user.id;
      -- Create a session for the user
      insert into app_private.sessions (user_id) values (v_user.id) returning * into v_session;
      -- And finally return the session
      return v_session;
    else
      -- Wrong password, bump all the attempt tracking figures
      update app_private.user_secrets
      set
        failed_password_attempts = (case when first_failed_password_attempt is null or first_failed_password_attempt < now() - v_login_attempt_window_duration then 1 else failed_password_attempts + 1 end),
        first_failed_password_attempt = (case when first_failed_password_attempt is null or first_failed_password_attempt < now() - v_login_attempt_window_duration then now() else first_failed_password_attempt end)
      where user_id = v_user.id;
      return null; -- Must not throw otherwise transaction will be aborted and attempts won't be recorded
    end if;
  else
    -- No user with that email/username was found
    return null;
  end if;
end;
$$ language plpgsql strict volatile;

comment on function app_private.login(username citext, password text) is
  E'Returns a user that matches the username/password combo, or null on failure.';

--! split: 1110-logout.sql
/*
 * Logging out deletes the session, and clears the session_id in the
 * transaction. This is a `SECURITY DEFINER` function, so we check that the
 * user is allowed to do it by matching the current_session_id().
 */
create function app_public.logout() returns void as $$
begin
  -- Delete the session
  delete from app_private.sessions where uuid = app_public.current_session_id();
  -- Clear the identifier from the transaction
  perform set_config('jwt.claims.session_id', '', true);
end;
$$ language plpgsql security definer volatile set search_path to pg_catalog, public, pg_temp;

--! split: 1120-forgot_password.sql
/*
 * When a user forgets their password we want to let them set a new one; but we
 * need to be very careful with this. We don't want to reveal whether or not an
 * account exists by the email address, so we email the entered email address
 * whether or not it's registered. If it's not registered, we track these
 * attempts in `unregistered_email_password_resets` to ensure that we don't
 * allow spamming the address; otherwise we store it to `user_email_secrets`.
 *
 * `app_public.forgot_password` is responsible for checking these things and
 * queueing a reset password token to be emailed to the user. For what happens
 * after the user receives this email, see instead `app_private.reset_password`.
 *
 * NOTE: unlike app_private.login and app_private.reset_password, rolling back
 * the results of this function will not cause any security issues so we do not
 * need to call it indirectly as we do for those other functions. (Rolling back
 * will undo the tracking of when we sent the email but it will also prevent
 * the email being sent, so it's harmless.)
 */

create table app_private.unregistered_email_password_resets (
  email citext constraint unregistered_email_pkey primary key,
  attempts int not null default 1,
  latest_attempt timestamptz not null
);
comment on table app_private.unregistered_email_password_resets is
  E'If someone tries to recover the password for an email that is not registered in our system, this table enables us to rate-limit outgoing emails to avoid spamming.';
comment on column app_private.unregistered_email_password_resets.attempts is
  E'We store the number of attempts to help us detect accounts being attacked.';
comment on column app_private.unregistered_email_password_resets.latest_attempt is
  E'We store the time the last password reset was sent to this email to prevent the email getting flooded.';

/**********/

create function app_public.forgot_password(email citext) returns void as $$
declare
  v_user_email app_public.user_emails;
  v_token text;
  v_token_min_duration_between_emails interval = interval '3 minutes';
  v_token_max_duration interval = interval '3 days';
  v_now timestamptz = clock_timestamp(); -- Function can be called multiple during transaction
  v_latest_attempt timestamptz;
begin
  -- Find the matching user_email:
  select user_emails.* into v_user_email
  from app_public.user_emails
  where user_emails.email = forgot_password.email
  order by is_verified desc, id desc;

  -- If there is no match:
  if v_user_email is null then
    -- This email doesn't exist in the system; trigger an email stating as much.

    -- We do not allow this email to be triggered more than once every 15
    -- minutes, so we need to track it:
    insert into app_private.unregistered_email_password_resets (email, latest_attempt)
      values (forgot_password.email, v_now)
      on conflict on constraint unregistered_email_pkey
      do update
        set latest_attempt = v_now, attempts = unregistered_email_password_resets.attempts + 1
        where unregistered_email_password_resets.latest_attempt < v_now - interval '15 minutes'
      returning latest_attempt into v_latest_attempt;

    if v_latest_attempt = v_now then
      perform graphile_worker.add_job(
        'user__forgot_password_unregistered_email',
        json_build_object('email', forgot_password.email::text)
      );
    end if;

    -- TODO: we should clear out the unregistered_email_password_resets table periodically.

    return;
  end if;

  -- There was a match.
  -- See if we've triggered a reset recently:
  if exists(
    select 1
    from app_private.user_email_secrets
    where user_email_id = v_user_email.id
    and password_reset_email_sent_at is not null
    and password_reset_email_sent_at > v_now - v_token_min_duration_between_emails
  ) then
    -- If so, take no action.
    return;
  end if;

  -- Fetch or generate reset token:
  update app_private.user_secrets
  set
    reset_password_token = (
      case
      when reset_password_token is null or reset_password_token_generated < v_now - v_token_max_duration
      then encode(gen_random_bytes(7), 'hex')
      else reset_password_token
      end
    ),
    reset_password_token_generated = (
      case
      when reset_password_token is null or reset_password_token_generated < v_now - v_token_max_duration
      then v_now
      else reset_password_token_generated
      end
    )
  where user_id = v_user_email.user_id
  returning reset_password_token into v_token;

  -- Don't allow spamming an email:
  update app_private.user_email_secrets
  set password_reset_email_sent_at = v_now
  where user_email_id = v_user_email.id;

  -- Trigger email send:
  perform graphile_worker.add_job(
    'user__forgot_password',
    json_build_object('id', v_user_email.user_id, 'email', v_user_email.email::text, 'token', v_token)
  );

end;
$$ language plpgsql strict security definer volatile set search_path to pg_catalog, public, pg_temp;

comment on function app_public.forgot_password(email public.citext) is
  E'If you''ve forgotten your password, give us one of your email addresses and we''ll send you a reset token. Note this only works if you have added an email address!';

--! split: 1130-reset_password.sql
/*
 * This is the second half of resetting a users password, please see
 * `app_public.forgot_password` for the first half.
 *
 * The `app_private.reset_password` function checks the reset token is correct
 * and sets the user's password to be the newly provided password, assuming
 * `assert_valid_password` is happy with it. If the attempt fails, this is
 * logged to avoid a brute force attack. Since we cannot risk this tracking
 * being lost (e.g. by a later error rolling back the transaction), we put this
 * function into app_private and explicitly call it from the `resetPassword`
 * field in `PassportLoginPlugin.ts`.
 */

create function app_private.assert_valid_password(new_password text) returns void as $$
begin
  -- TODO: add better assertions!
  if length(new_password) < 8 then
    raise exception 'Password is too weak' using errcode = 'WEAKP';
  end if;
end;
$$ language plpgsql volatile;

create function app_private.reset_password(user_id uuid, reset_token text, new_password text) returns boolean as $$
declare
  v_user app_public.users;
  v_user_secret app_private.user_secrets;
  v_token_max_duration interval = interval '3 days';
begin
  select users.* into v_user
  from app_public.users
  where id = user_id;

  if not (v_user is null) then
    -- Load their secrets
    select * into v_user_secret from app_private.user_secrets
    where user_secrets.user_id = v_user.id;

    -- Have there been too many reset attempts?
    if (
      v_user_secret.first_failed_reset_password_attempt is not null
    and
      v_user_secret.first_failed_reset_password_attempt > NOW() - v_token_max_duration
    and
      v_user_secret.failed_reset_password_attempts >= 20
    ) then
      raise exception 'Password reset locked - too many reset attempts' using errcode = 'LOCKD';
    end if;

    -- Not too many reset attempts, let's check the token
    if v_user_secret.reset_password_token = reset_token then
      -- Excellent - they're legit

      perform app_private.assert_valid_password(new_password);

      -- Let's reset the password as requested
      update app_private.user_secrets
      set
        password_hash = crypt(new_password, gen_salt('bf')),
        failed_password_attempts = 0,
        first_failed_password_attempt = null,
        reset_password_token = null,
        reset_password_token_generated = null,
        failed_reset_password_attempts = 0,
        first_failed_reset_password_attempt = null
      where user_secrets.user_id = v_user.id;

      -- Revoke the users' sessions
      delete from app_private.sessions
      where sessions.user_id = v_user.id;

      -- Notify user their password was reset
      perform graphile_worker.add_job(
        'user__audit',
        json_build_object(
          'type', 'reset_password',
          'user_id', v_user.id,
          'current_user_id', app_public.current_user_id()
        ));

      return true;
    else
      -- Wrong token, bump all the attempt tracking figures
      update app_private.user_secrets
      set
        failed_reset_password_attempts = (case when first_failed_reset_password_attempt is null or first_failed_reset_password_attempt < now() - v_token_max_duration then 1 else failed_reset_password_attempts + 1 end),
        first_failed_reset_password_attempt = (case when first_failed_reset_password_attempt is null or first_failed_reset_password_attempt < now() - v_token_max_duration then now() else first_failed_reset_password_attempt end)
      where user_secrets.user_id = v_user.id;
      return null;
    end if;
  else
    -- No user with that id was found
    return null;
  end if;
end;
$$ language plpgsql strict volatile;

--! split: 1140-request_account_deletion.sql
/*
 * For security reasons we don't want to allow a user to just delete their user
 * account without confirmation; so we have them request deletion, receive an
 * email, and then click the link in the email and press a button to confirm
 * deletion. This function handles the first step in this process; see
 * `app_public.confirm_account_deletion` for the second half.
 */

create function app_public.request_account_deletion() returns boolean as $$
declare
  v_user_email app_public.user_emails;
  v_token text;
  v_token_max_duration interval = interval '3 days';
begin
  if app_public.current_user_id() is null then
    raise exception 'You must log in to delete your account' using errcode = 'LOGIN';
  end if;

  -- Get the email to send account deletion token to
  select * into v_user_email
    from app_public.user_emails
    where user_id = app_public.current_user_id()
    order by is_primary desc, is_verified desc, id desc
    limit 1;

  -- Fetch or generate token
  update app_private.user_secrets
  set
    delete_account_token = (
      case
      when delete_account_token is null or delete_account_token_generated < NOW() - v_token_max_duration
      then encode(gen_random_bytes(7), 'hex')
      else delete_account_token
      end
    ),
    delete_account_token_generated = (
      case
      when delete_account_token is null or delete_account_token_generated < NOW() - v_token_max_duration
      then now()
      else delete_account_token_generated
      end
    )
  where user_id = app_public.current_user_id()
  returning delete_account_token into v_token;

  -- Trigger email send
  perform graphile_worker.add_job('user__send_delete_account_email', json_build_object('email', v_user_email.email::text, 'token', v_token));
  return true;
end;
$$ language plpgsql strict security definer volatile set search_path to pg_catalog, public, pg_temp;

comment on function app_public.request_account_deletion() is
  E'Begin the account deletion flow by requesting the confirmation email';

--! split: 1150-confirm_account_deletion.sql
/*
 * This is the second half of the account deletion process, for the first half
 * see `app_public.request_account_deletion`.
 */
create function app_public.confirm_account_deletion(token text) returns boolean as $$
declare
  v_user_secret app_private.user_secrets;
  v_token_max_duration interval = interval '3 days';
begin
  if app_public.current_user_id() is null then
    raise exception 'You must log in to delete your account' using errcode = 'LOGIN';
  end if;

  select * into v_user_secret
    from app_private.user_secrets
    where user_secrets.user_id = app_public.current_user_id();

  if v_user_secret is null then
    -- Success: they're already deleted
    return true;
  end if;

  -- Check the token
  if (
    -- token is still valid
    v_user_secret.delete_account_token_generated > now() - v_token_max_duration
  and
    -- token matches
    v_user_secret.delete_account_token = token
  ) then
    -- Token passes; delete their account :(
    delete from app_public.users where id = app_public.current_user_id();
    return true;
  end if;

  raise exception 'The supplied token was incorrect - perhaps you''re logged in to the wrong account, or the token has expired?' using errcode = 'DNIED';
end;
$$ language plpgsql strict volatile security definer set search_path to pg_catalog, public, pg_temp;

comment on function app_public.confirm_account_deletion(token text) is
  E'If you''re certain you want to delete your account, use `requestAccountDeletion` to request an account deletion token, and then supply the token through this mutation to complete account deletion.';

--! split: 1160-change_password.sql
/*
 * To change your password you must specify your previous password. The form in
 * the web UI may confirm that the new password was typed correctly by making
 * the user type it twice, but that isn't necessary in the API.
 */

create function app_public.change_password(old_password text, new_password text) returns boolean as $$
declare
  v_user app_public.users;
  v_user_secret app_private.user_secrets;
begin
  select users.* into v_user
  from app_public.users
  where id = app_public.current_user_id();

  if not (v_user is null) then
    -- Load their secrets
    select * into v_user_secret from app_private.user_secrets
    where user_secrets.user_id = v_user.id;

    if v_user_secret.password_hash = crypt(old_password, v_user_secret.password_hash) then
      perform app_private.assert_valid_password(new_password);

      -- Reset the password as requested
      update app_private.user_secrets
      set
        password_hash = crypt(new_password, gen_salt('bf'))
      where user_secrets.user_id = v_user.id;

      -- Revoke all other sessions
      delete from app_private.sessions
      where sessions.user_id = v_user.id
      and sessions.uuid <> app_public.current_session_id();

      -- Notify user their password was changed
      perform graphile_worker.add_job(
        'user__audit',
        json_build_object(
          'type', 'change_password',
          'user_id', v_user.id,
          'current_user_id', app_public.current_user_id()
        ));

      return true;
    else
      raise exception 'Incorrect password' using errcode = 'CREDS';
    end if;
  else
    raise exception 'You must log in to change your password' using errcode = 'LOGIN';
  end if;
end;
$$ language plpgsql strict volatile security definer set search_path to pg_catalog, public, pg_temp;

comment on function app_public.change_password(old_password text, new_password text) is
  E'Enter your old password and a new password to change your password.';

grant execute on function app_public.change_password(text, text) to :DATABASE_VISITOR;

--! split: 1200-user-registration.sql
/*
 * A user account may be created explicitly via the GraphQL `register` mutation
 * (which calls `really_create_user` below), or via OAuth (which, via
 * `installPassportStrategy.ts`, calls link_or_register_user below, which may
 * then call really_create_user). Ultimately `really_create_user` is called in
 * all cases to create a user account within our system, so it must do
 * everything we'd expect in this case including validating username/password,
 * setting the password (if any), storing the email address, etc.
 */

create function app_private.really_create_user(
  username citext,
  email text,
  email_is_verified bool,
  nickname text,
  avatar_url text,
  password text default null
) returns app_public.users as $$
declare
  v_user app_public.users;
  v_username citext = username;
begin
  if password is not null then
    perform app_private.assert_valid_password(password);
  end if;
  if email is null then
    raise exception 'Email is required' using errcode = 'MODAT';
  end if;

  -- Insert the new user
  insert into app_public.users (username, nickname, avatar_url) values
    (v_username, nickname, avatar_url)
    returning * into v_user;

	-- Add the user's email
  insert into app_public.user_emails (user_id, email, is_verified, is_primary)
  values (v_user.id, email, email_is_verified, email_is_verified);

  -- Store the password
  if password is not null then
    update app_private.user_secrets
    set password_hash = crypt(password, gen_salt('bf'))
    where user_id = v_user.id;
  end if;

  -- Refresh the user
  select * into v_user from app_public.users where id = v_user.id;

  return v_user;
end;
$$ language plpgsql volatile set search_path to pg_catalog, public, pg_temp;

comment on function app_private.really_create_user(username citext, email text, email_is_verified bool, nickname text, avatar_url text, password text) is
  E'Creates a user account. All arguments are optional, it trusts the calling method to perform sanitisation.';

/**********/

/*
 * The `register_user` function is called by `link_or_register_user` when there
 * is no matching user to link the login to, so we want to register the user
 * using OAuth or similar credentials.
 */

create function app_private.register_user(
  f_service character varying,
  f_identifier character varying,
  f_profile json,
  f_auth_details json,
  f_email_is_verified boolean default false
) returns app_public.users as $$
declare
  v_user app_public.users;
  v_email citext;
  v_name text;
  v_username citext;
  v_avatar_url text;
  v_user_authentication_id uuid;
begin
  -- Extract data from the user’s OAuth profile data.
  v_email := f_profile ->> 'email';
  v_name := f_profile ->> 'name';
  v_username := f_profile ->> 'username';
  v_avatar_url := f_profile ->> 'avatar_url';

  -- Sanitise the username, and make it unique if necessary.
  if v_username is null then
    v_username = coalesce(v_name, 'user');
  end if;
  v_username = regexp_replace(v_username, '^[^a-z]+', '', 'gi');
  v_username = regexp_replace(v_username, '[^a-z0-9]+', '_', 'gi');
  if v_username is null or length(v_username) < 3 then
    v_username = 'user';
  end if;
  select (
    case
    when i = 0 then v_username
    else v_username || i::text
    end
  ) into v_username from generate_series(0, 1000) i
  where not exists(
    select 1
    from app_public.users
    where users.username = (
      case
      when i = 0 then v_username
      else v_username || i::text
      end
    )
  )
  limit 1;

  -- Create the user account
  v_user = app_private.really_create_user(
    username => v_username,
    email => v_email,
    email_is_verified => f_email_is_verified,
    nickname => v_name,
    avatar_url => v_avatar_url
  );

  -- Insert the user’s private account data (e.g. OAuth tokens)
  insert into app_public.user_authentications (user_id, service, identifier, details) values
    (v_user.id, f_service, f_identifier, f_profile) returning id into v_user_authentication_id;
  insert into app_private.user_authentication_secrets (user_authentication_id, details) values
    (v_user_authentication_id, f_auth_details);

  return v_user;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

comment on function app_private.register_user(f_service character varying, f_identifier character varying, f_profile json, f_auth_details json, f_email_is_verified boolean) is
  E'Used to register a user from information gleaned from OAuth. Primarily used by link_or_register_user';

/**********/

/*
 * The `link_or_register_user` function is called from
 * `installPassportStrategy.ts` when a user logs in with a social login
 * provider (OAuth), e.g. GitHub, Facebook, etc. If the user is already logged
 * in then the new provider will be linked to the users account, otherwise we
 * will try to retrieve an existing account using these details (matching the
 * service/identifier or the email address), and failing that we will register
 * a new user account linked to this service via the `register_user` function.
 *
 * This function is also responsible for keeping details in sync with the login
 * provider whenever the user logs in; you'll see this in the `update`
 * statemets towards the bottom of the function.
 */

create function app_private.link_or_register_user(
  f_user_id uuid,
  f_service character varying,
  f_identifier character varying,
  f_profile json,
  f_auth_details json
) returns app_public.users as $$
declare
  v_matched_user_id uuid;
  v_matched_authentication_id uuid;
  v_email citext;
  v_name text;
  v_avatar_url text;
  v_user app_public.users;
  v_user_email app_public.user_emails;
begin
  -- See if a user account already matches these details
  select id, user_id
    into v_matched_authentication_id, v_matched_user_id
    from app_public.user_authentications
    where service = f_service
    and identifier = f_identifier
    limit 1;

  if v_matched_user_id is not null and f_user_id is not null and v_matched_user_id <> f_user_id then
    raise exception 'A different user already has this account linked.' using errcode = 'TAKEN';
  end if;

  v_email = f_profile ->> 'email';
  v_name := f_profile ->> 'name';
  v_avatar_url := f_profile ->> 'avatar_url';

  if v_matched_authentication_id is null then
    if f_user_id is not null then
      -- Link new account to logged in user account
      insert into app_public.user_authentications (user_id, service, identifier, details) values
        (f_user_id, f_service, f_identifier, f_profile) returning id, user_id into v_matched_authentication_id, v_matched_user_id;
      insert into app_private.user_authentication_secrets (user_authentication_id, details) values
        (v_matched_authentication_id, f_auth_details);
      perform graphile_worker.add_job(
        'user__audit',
        json_build_object(
          'type', 'linked_account',
          'user_id', f_user_id,
          'extra1', f_service,
          'extra2', f_identifier,
          'current_user_id', app_public.current_user_id()
        ));
    elsif v_email is not null then
      -- See if the email is registered
      select * into v_user_email from app_public.user_emails where email = v_email and is_verified is true;
      if v_user_email is not null then
        -- User exists!
        insert into app_public.user_authentications (user_id, service, identifier, details) values
          (v_user_email.user_id, f_service, f_identifier, f_profile) returning id, user_id into v_matched_authentication_id, v_matched_user_id;
        insert into app_private.user_authentication_secrets (user_authentication_id, details) values
          (v_matched_authentication_id, f_auth_details);
        perform graphile_worker.add_job(
          'user__audit',
          json_build_object(
            'type', 'linked_account',
            'user_id', f_user_id,
            'extra1', f_service,
            'extra2', f_identifier,
            'current_user_id', app_public.current_user_id()
          ));
      end if;
    end if;
  end if;
  if v_matched_user_id is null and f_user_id is null and v_matched_authentication_id is null then
    -- Create and return a new user account
    return app_private.register_user(f_service, f_identifier, f_profile, f_auth_details, true);
  else
    if v_matched_authentication_id is not null then
      update app_public.user_authentications
        set details = f_profile
        where id = v_matched_authentication_id;
      update app_private.user_authentication_secrets
        set details = f_auth_details
        where user_authentication_id = v_matched_authentication_id;
      update app_public.users
        set
          nickname = coalesce(users.nickname, v_name),
          avatar_url = coalesce(users.avatar_url, v_avatar_url)
        where id = v_matched_user_id
        returning  * into v_user;
      return v_user;
    else
      -- v_matched_authentication_id is null
      -- -> v_matched_user_id is null (they're paired)
      -- -> f_user_id is not null (because the if clause above)
      -- -> v_matched_authentication_id is not null (because of the separate if block above creating a user_authentications)
      -- -> contradiction.
      raise exception 'This should not occur';
    end if;
  end if;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

comment on function app_private.link_or_register_user(f_user_id uuid, f_service character varying, f_identifier character varying, f_profile json, f_auth_details json) is
  E'If you''re logged in, this will link an additional OAuth login to your account if necessary. If you''re logged out it may find if an account already exists (based on OAuth details or email address) and return that, or create a new user account if necessary.';

--! split: 1210-make_email_primary.sql
/*
 * The user is only allowed to have one primary email, and that email must be
 * verified. This function lets the user change which of their verified emails
 * is the primary email.
 */

create function app_public.make_email_primary(email_id uuid) returns app_public.user_emails as $$
declare
  v_user_email app_public.user_emails;
begin
  select * into v_user_email from app_public.user_emails where id = email_id and user_id = app_public.current_user_id();
  if v_user_email is null then
    raise exception 'That''s not your email' using errcode = 'DNIED';
    return null;
  end if;
  if v_user_email.is_verified is false then
    raise exception 'You may not make an unverified email primary' using errcode = 'VRFY1';
  end if;
  update app_public.user_emails set is_primary = false where user_id = app_public.current_user_id() and is_primary is true and id <> email_id;
  update app_public.user_emails set is_primary = true where user_id = app_public.current_user_id() and is_primary is not true and id = email_id returning * into v_user_email;
  return v_user_email;
end;
$$ language plpgsql strict volatile security definer set search_path to pg_catalog, public, pg_temp;
comment on function app_public.make_email_primary(email_id uuid) is
  E'Your primary email is where we''ll notify of account events; other emails may be used for discovery or login. Use this when you''re changing your email address.';

--! split: 1220-resend_email_verification_code.sql
/*
 * If you don't receive the email verification email, you can trigger a resend
 * with this function.
 */
create function app_public.resend_email_verification_code(email_id uuid) returns boolean as $$
begin
  if exists(
    select 1
    from app_public.user_emails
    where user_emails.id = email_id
    and user_id = app_public.current_user_id()
    and is_verified is false
  ) then
    perform graphile_worker.add_job('user_emails__send_verification', json_build_object('id', email_id));
    return true;
  end if;
  return false;
end;
$$ language plpgsql strict volatile security definer set search_path to pg_catalog, public, pg_temp;
comment on function app_public.resend_email_verification_code(email_id uuid) is
  E'If you didn''t receive the verification code for this email, we can resend it. We silently cap the rate of resends on the backend, so calls to this function may not result in another email being sent if it has been called recently.';

--! split: 2000-organizations-reset.sql
/*
 * The organizations functionality in Starter is modelled in a way that would
 * be typically useful for a B2B SaaS project: the organization can have
 * multiple members, one of which is the "owner", one is the "billing contact"
 * and the others are just regular members (though you can of course add
 * additional tiers by adding columns to the `organization_memberships` table).
 *
 * This file drops all the organizations functionality, but it's unnecessary
 * because `0001-reset.sql` has already done all that; we just include it
 * because you might want to separate the organizations functionality into a
 * separate migration, and this makes iteration faster.
 */
drop function if exists app_public.transfer_organization_billing_contact(uuid, uuid);
drop function if exists app_public.transfer_organization_ownership(uuid, uuid);
drop function if exists app_public.delete_organization(uuid);
drop function if exists app_public.remove_from_organization(uuid, uuid);
drop function if exists app_public.organizations_current_user_is_billing_contact(app_public.organizations);
drop function if exists app_public.organizations_current_user_is_owner(app_public.organizations);
drop function if exists app_public.accept_invitation_to_organization(uuid, text) cascade;
drop function if exists app_public.get_organization_for_invitation(uuid, text) cascade;
drop function if exists app_public.organization_for_invitation(uuid, text) cascade;
drop function if exists app_public.invite_user_to_organization(uuid, uuid) cascade;
drop function if exists app_public.invite_to_organization(uuid, citext, citext) cascade;
drop function if exists app_public.current_user_invited_organization_ids() cascade;
drop function if exists app_public.current_user_member_organization_ids() cascade;
drop table if exists app_public.organization_invitations;
drop table if exists app_public.organization_memberships;
drop table if exists app_public.organizations cascade;

--! split: 2010-organizations.sql
/*
 * Organizations have a name, and a unique identifier we call the "slug" (it's
 * like a user's username). Both of these are updatable.
 */
create table app_public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
alter table app_public.organizations enable row level security;

grant select on app_public.organizations to :DATABASE_VISITOR;
grant update(name, slug) on app_public.organizations to :DATABASE_VISITOR;

-- Note we can't define the RLS policies for an organization until we've defined membership of the organization, so RLS policies will come a little later.

--! split: 2019-organization_memberships.sql
/*
 * This table details who is a member of an organization. When someone is
 * invited to an organization they won't have an entry in this table until
 * their invitation is accepted (for invitations, see
 * `organization_invitations`).
 */

create table app_public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app_public.organizations on delete cascade,
  user_id uuid not null references app_public.users on delete cascade,
  is_owner boolean not null default false,
  is_billing_contact boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
alter table app_public.organization_memberships enable row level security;

create index on app_public.organization_memberships (user_id);

grant select on app_public.organization_memberships to :DATABASE_VISITOR;

-- We can't define RLS policies on organization_memberships yet because we need
-- to know if you're invited; so RLS policies will come later.

--! split: 2030-organization_invitations.sql
/*
 * When a user is invited to an organization, a record will be added to this
 * table. Once the invitation is accepted, the record will be deleted. We'll
 * handle the mechanics of invitation later.
 */
create table app_public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app_public.organizations on delete cascade,
  code text,
  user_id uuid references app_public.users on delete cascade,
  email citext,
  check ((user_id is null) <> (email is null)),
  check ((code is null) = (email is null)),
  unique (organization_id, user_id),
  unique (organization_id, email)
);
alter table app_public.organization_invitations enable row level security;

create index on app_public.organization_invitations(user_id);

-- We're not granting any privileges here since we don't need any currently.
-- grant select on app_public.organization_invitations to :DATABASE_VISITOR;

-- Send the user an invitation email to join the organization
create trigger _500_send_email after insert on app_public.organization_invitations
  for each row execute procedure app_private.tg__add_job('organization_invitations__send_invite');

--! split: 2040-create_organization.sql
/*
 * When a user creates an organization they automatically become the owner and
 * billing contact of that organization.
 */

create function app_public.create_organization(slug citext, name text) returns app_public.organizations as $$
declare
  v_org app_public.organizations;
begin
  if app_public.current_user_id() is null then
    raise exception 'You must log in to create an organization' using errcode = 'LOGIN';
  end if;
  insert into app_public.organizations (slug, name) values (slug, name) returning * into v_org;
  insert into app_public.organization_memberships (organization_id, user_id, is_owner, is_billing_contact)
    values(v_org.id, app_public.current_user_id(), true, true);
  return v_org;
end;
$$ language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp;

--! split: 2050-invite_to_organization.sql
/*
 * This function allows you to invite someone to an organization; you either
 * need to know their username (in which case they must already have an
 * account) or their email (in which case they will be sent an invitation to
 * create an account if they don't already have one, this is handled by the
 * _500_send_email trigger on organization_invitations).
 */
create function app_public.invite_to_organization(organization_id uuid, username citext = null, email citext = null)
  returns void as $$
declare
  v_code text;
  v_user app_public.users;
begin
  -- Are we allowed to add this person
  -- Are we logged in
  if app_public.current_user_id() is null then
    raise exception 'You must log in to invite a user' using errcode = 'LOGIN';
  end if;

  select * into v_user from app_public.users where users.username = invite_to_organization.username;

  -- Are we the owner of this organization
  if not exists(
    select 1 from app_public.organization_memberships
      where organization_memberships.organization_id = invite_to_organization.organization_id
      and organization_memberships.user_id = app_public.current_user_id()
      and is_owner is true
  ) then
    raise exception 'You''re not the owner of this organization' using errcode = 'DNIED';
  end if;

  if v_user.id is not null and exists(
    select 1 from app_public.organization_memberships
      where organization_memberships.organization_id = invite_to_organization.organization_id
      and organization_memberships.user_id = v_user.id
  ) then
    raise exception 'Cannot invite someone who is already a member' using errcode = 'ISMBR';
  end if;

  if email is not null then
    v_code = encode(gen_random_bytes(7), 'hex');
  end if;

  if v_user.id is not null and not v_user.is_verified then
    raise exception 'The user you attempted to invite has not verified their account' using errcode = 'VRFY2';
  end if;

  if v_user.id is null and email is null then
    raise exception 'Could not find person to invite' using errcode = 'NTFND';
  end if;

  -- Invite the user
  insert into app_public.organization_invitations(organization_id, user_id, email, code)
    values (invite_to_organization.organization_id, v_user.id, email, v_code);
end;
$$ language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp;

--! split: 2060-organization-permissions.sql
/*
 * Users can see organizations and organization members if they are themselves
 * a member of the same organization, or if they've been invited to that
 * organization. To achieve that, we create two SECURITY DEFINER functions
 * (which bypass RLS) to determine which organizations you're a member of or
 * have been invited to, and then use these in the policies below. NOTE: we're
 * not expecting a particularly large number of values to be returned from
 * these functions.
 */

create function app_public.current_user_member_organization_ids() returns setof uuid as $$
  select organization_id from app_public.organization_memberships
    where user_id = app_public.current_user_id();
$$ language sql stable security definer set search_path = pg_catalog, public, pg_temp;

create function app_public.current_user_invited_organization_ids() returns setof uuid as $$
  select organization_id from app_public.organization_invitations
    where user_id = app_public.current_user_id();
$$ language sql stable security definer set search_path = pg_catalog, public, pg_temp;

create policy select_member on app_public.organizations
  for select using (id in (select app_public.current_user_member_organization_ids()));

create policy select_invited on app_public.organizations
  for select using (id in (select app_public.current_user_invited_organization_ids()));

create policy select_member on app_public.organization_memberships
  for select using (organization_id in (select app_public.current_user_member_organization_ids()));

create policy select_invited on app_public.organization_memberships
  for select using (organization_id in (select app_public.current_user_invited_organization_ids()));

create policy update_owner on app_public.organizations for update using (exists(
  select 1
  from app_public.organization_memberships
  where organization_id = organizations.id
  and user_id = app_public.current_user_id()
  and is_owner is true
));

--! split: 2070-organization_for_invitation.sql
/*
 * When you receive an invitation code (but don't yet have an account) you may
 * wish to see the organization before creating an account; this function
 * allows you to do so. It only shows you the organization, not the members,
 * you'll need to sign up (and verify your email) for that.
 */
create function app_public.organization_for_invitation(invitation_id uuid, code text = null)
  returns app_public.organizations as $$
declare
  v_invitation app_public.organization_invitations;
  v_organization app_public.organizations;
begin
  if app_public.current_user_id() is null then
    raise exception 'You must log in to accept an invitation' using errcode = 'LOGIN';
  end if;

  select * into v_invitation from app_public.organization_invitations where id = invitation_id;

  if v_invitation is null then
    raise exception 'We could not find that invitation' using errcode = 'NTFND';
  end if;

  if v_invitation.user_id is not null then
    if v_invitation.user_id is distinct from app_public.current_user_id() then
      raise exception 'That invitation is not for you' using errcode = 'DNIED';
    end if;
  else
    if v_invitation.code is distinct from code then
      raise exception 'Incorrect invitation code' using errcode = 'DNIED';
    end if;
  end if;

  select * into v_organization from app_public.organizations where id = v_invitation.organization_id;

  return v_organization;
end;
$$ language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp;

--! split: 2080-accept_invitation_to_organization.sql
/*
 * This function accepts an invitation to join the organization and adds you to
 * the organization (deleting the invite).  If you were invited by username (or
 * your account could already be determined) you can accept an invitation
 * directly by the invitation_id; otherwise you will need the code as well to
 * prove you are the person that was invited (for example if you were invited
 * using a different email address to that which you created your account
 * with).
 */
create function app_public.accept_invitation_to_organization(invitation_id uuid, code text = null)
  returns void as $$
declare
  v_organization app_public.organizations;
begin
  v_organization = app_public.organization_for_invitation(invitation_id, code);

  -- Accept the user into the organization
  insert into app_public.organization_memberships (organization_id, user_id)
    values(v_organization.id, app_public.current_user_id())
    on conflict do nothing;

  -- Delete the invitation
  delete from app_public.organization_invitations where id = invitation_id;
end;
$$ language plpgsql volatile security definer set search_path = pg_catalog, public, pg_temp;

--! split: 2090-remove_from_organization.sql
/*
 * This function can be used to remove yourself or (if you're the org owner)
 * someone else from an organization. Idempotent - if they're not a member then
 * just return. Assume they know the rules; don't throw error if they're not
 * allowed, just return.
 */
create function app_public.remove_from_organization(
  organization_id uuid,
  user_id uuid
) returns void as $$
declare
  v_my_membership app_public.organization_memberships;
begin
  select * into v_my_membership
    from app_public.organization_memberships
    where organization_memberships.organization_id = remove_from_organization.organization_id
    and organization_memberships.user_id = app_public.current_user_id();

  if (v_my_membership is null) then
    -- I'm not a member of that organization
    return;
  elsif v_my_membership.is_owner then
    if remove_from_organization.user_id <> app_public.current_user_id() then
      -- Delete it
    else
      -- Need to transfer ownership before I can leave
      return;
    end if;
  elsif v_my_membership.user_id = user_id then
    -- Delete it
  else
    -- Not allowed to delete it
    return;
  end if;

  if v_my_membership.is_billing_contact then
    update app_public.organization_memberships
      set is_billing_contact = false
      where id = v_my_membership.id
      returning * into v_my_membership;
    update app_public.organization_memberships
      set is_billing_contact = true
      where organization_memberships.organization_id = remove_from_organization.organization_id
      and organization_memberships.is_owner;
  end if;

  delete from app_public.organization_memberships
    where organization_memberships.organization_id = remove_from_organization.organization_id
    and organization_memberships.user_id = remove_from_organization.user_id;

end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

--! split: 2100-organization-computed-columns.sql
/*
 * Shortcut telling the client if the current user is the organization owner
 * without having to manually traverse into organization_memberships.
 */
create function app_public.organizations_current_user_is_owner(
  org app_public.organizations
) returns boolean as $$
  select exists(
    select 1
    from app_public.organization_memberships
    where organization_id = org.id
    and user_id = app_public.current_user_id()
    and is_owner is true
  )
$$ language sql stable;

/*
 * Shortcut telling the client if the current user is the organization billing
 * contact without having to manually traverse into organization_memberships.
 */
create function app_public.organizations_current_user_is_billing_contact(
  org app_public.organizations
) returns boolean as $$
  select exists(
    select 1
    from app_public.organization_memberships
    where organization_id = org.id
    and user_id = app_public.current_user_id()
    and is_billing_contact is true
  )
$$ language sql stable;

--! split: 2110-dont-allow-user-delete-when-organization.sql
/*
 * This trigger/trigger function prevents deleting a user if they're the owner
 * of any organizations (first you must delete the organizations or transfer
 * ownership before you can delete your account).
 */
create function app_public.tg_users__deletion_organization_checks_and_actions() returns trigger as $$
begin
  -- Check they're not an organization owner
  if exists(
    select 1
    from app_public.organization_memberships
    where user_id = app_public.current_user_id()
    and is_owner is true
  ) then
    raise exception 'You cannot delete your account until you are not the owner of any organizations.' using errcode = 'OWNER';
  end if;

  -- Reassign billing contact status back to the organization owner
  update app_public.organization_memberships
    set is_billing_contact = true
    where is_owner = true
    and organization_id in (
      select organization_id
      from app_public.organization_memberships my_memberships
      where my_memberships.user_id = app_public.current_user_id()
      and is_billing_contact is true
    );

  return old;
end;
$$ language plpgsql;

create trigger _500_deletion_organization_checks_and_actions
  before delete
  on app_public.users
  for each row
  when (app_public.current_user_id() is not null)
  execute procedure app_public.tg_users__deletion_organization_checks_and_actions();

--! split: 2120-delete_organization.sql
/*
 * Function to delete an organization; only works if you're the owner.
 */
create function app_public.delete_organization(organization_id uuid) returns void as $$
begin
  if exists(
    select 1
    from app_public.organization_memberships
    where user_id = app_public.current_user_id()
    and organization_memberships.organization_id = delete_organization.organization_id
    and is_owner is true
  ) then
    delete from app_public.organizations where id = organization_id;
  end if;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

--! split: 2130-transfer_organization_ownership.sql
/*
 * Allows organization owner to transfer ownership of the organization to
 * another organization member.
 */
create function app_public.transfer_organization_ownership(organization_id uuid, user_id uuid) returns app_public.organizations as $$
declare
 v_org app_public.organizations;
begin
  if exists(
    select 1
    from app_public.organization_memberships
    where organization_memberships.user_id = app_public.current_user_id()
    and organization_memberships.organization_id = transfer_organization_ownership.organization_id
    and is_owner is true
  ) then
    update app_public.organization_memberships
      set is_owner = true
      where organization_memberships.organization_id = transfer_organization_ownership.organization_id
      and organization_memberships.user_id = transfer_organization_ownership.user_id;
    if found then
      update app_public.organization_memberships
        set is_owner = false
        where organization_memberships.organization_id = transfer_organization_ownership.organization_id
        and organization_memberships.user_id = app_public.current_user_id();

      select * into v_org from app_public.organizations where id = organization_id;
      return v_org;
    end if;
  end if;
  return null;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

--! split: 2140-transfer_organization_billing_contact.sql
/*
 * Allows organization owner to transfer billing contact for the organization
 * to another organization member.
 */
create function app_public.transfer_organization_billing_contact(organization_id uuid, user_id uuid) returns app_public.organizations as $$
declare
 v_org app_public.organizations;
begin
  if exists(
    select 1
    from app_public.organization_memberships
    where organization_memberships.user_id = app_public.current_user_id()
    and organization_memberships.organization_id = transfer_organization_billing_contact.organization_id
    and is_owner is true
  ) then
    update app_public.organization_memberships
      set is_billing_contact = true
      where organization_memberships.organization_id = transfer_organization_billing_contact.organization_id
      and organization_memberships.user_id = transfer_organization_billing_contact.user_id;
    if found then
      update app_public.organization_memberships
        set is_billing_contact = false
        where organization_memberships.organization_id = transfer_organization_billing_contact.organization_id
        and organization_memberships.user_id <> transfer_organization_billing_contact.user_id
        and is_billing_contact = true;

      select * into v_org from app_public.organizations where id = organization_id;
      return v_org;
    end if;
  end if;
  return null;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

--! split: 3000-pupcle_user-reset.sql
drop table if exists app_public.friend_requests;

drop function if exists app_public.current_user_shared_friend_ids();
drop trigger if exists _200_unfriend on app_public.user_edges;
drop function if exists app_public.tg_user_edges__unfriend();
drop table if exists app_public.user_edges;
drop table if exists app_public.share_level;

drop trigger if exists _200_notification_on_friend_request on app_public.friend_requests;
drop function if exists app_private.tg_notification_on_friend_request();
drop trigger if exists _100_timestamps on app_public.notifications;
drop table if exists app_public.notifications;

drop trigger if exists _550_insert_entries on app_public.users;
drop function if exists app_public.tg_user_entries__insert_with_user();
drop table if exists app_public.user_entries;

revoke usage on schema app_public from :DATABASE_AUTHENTICATOR;

--! split: 3010-pupcle_user.sql
grant usage on schema app_public to :DATABASE_AUTHENTICATOR;

create table app_public.user_entries (
  user_id                               uuid not null primary key references app_public.users on delete cascade,
  name                             text,
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
  name,
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

--! split: 3020-notifications.sql
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

--! split: 3030-user_edges.sql
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

create index on app_public.user_edges (daily_records_shared);
create index on app_public.user_edges (from_user_id, daily_records_shared);
create index on app_public.user_edges (to_user_id);

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
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;
create trigger _200_unfriend
  after delete on app_public.user_edges
  for each row
  execute procedure app_public.tg_user_edges__unfriend();
comment on function app_public.tg_user_edges__unfriend() is
  E'Ensures that when user A unfriends user B, user B unfriends user A.';

create function app_public.current_user_shared_friend_ids() returns setof uuid as $$
  select to_user_id from app_public.user_edges
    where from_user_id = app_public.current_user_id() and daily_records_shared = 'SUMMARY';
$$ language sql stable security definer set search_path = pg_catalog, public, pg_temp;

create table app_public.friend_requests (
  from_user_id          uuid not null references app_public.users on delete cascade,
  to_user_id            uuid not null references app_public.users on delete cascade,
  primary key (from_user_id, to_user_id),
  -- null: not accepted, true: accepted, false: rejected
  -- accepted              boolean default null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table app_public.friend_requests enable row level security;

-- enables select * where to_user_id = myself
create index on app_public.friend_requests (to_user_id);

create policy select_from_me on app_public.friend_requests for select using (from_user_id = app_public.current_user_id());
create policy select_to_me on app_public.friend_requests for select using (to_user_id = app_public.current_user_id());
create policy insert_from_me on app_public.friend_requests for insert with check (from_user_id = app_public.current_user_id());
-- create policy update_to_me on app_public.friend_requests for update using (to_user_id = app_public.current_user_id());
create policy delete_from_me on app_public.friend_requests for delete using (from_user_id = app_public.current_user_id());
create policy delete_to_me on app_public.friend_requests for delete using (to_user_id = app_public.current_user_id());

grant select on app_public.friend_requests to :DATABASE_VISITOR;
grant insert(from_user_id, to_user_id) on app_public.friend_requests to :DATABASE_VISITOR;
-- grant update(accepted) on app_public.friend_requests to :DATABASE_VISITOR;
grant delete on app_public.friend_requests to :DATABASE_VISITOR;

create trigger _100_timestamps
  before insert or update on app_public.friend_requests
  for each row
  execute procedure app_private.tg__timestamps();

create function app_public.tg_notification_on_friend_request() returns trigger as $$
declare
  v_new boolean;
begin
  if tg_when = 'AFTER' then
    v_new := false;
    if (TG_OP = 'INSERT') then
      v_new := true;
    end if;

    if v_new = true then
      perform graphile_worker.add_job(
        'create_notification',
        json_build_object(
          'type', 'received_friend_request',
          'for_user_id', NEW.to_user_id,
          'from_user_id', NEW.from_user_id
        ));
    end if;
  end if;
  return null;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

create trigger _200_notification_on_friend_request
  after insert or update
  on app_public.friend_requests
  for each row
  execute procedure app_public.tg_notification_on_friend_request();
comment on function app_public.tg_notification_on_friend_request() is
  E'Send notification on new friend request';

--! split: 4000-pets-reset.sql
drop table if exists app_public.pets;
drop type if exists app_public.weight;
drop table if exists app_public.pet_gender;
drop table if exists app_public.pet_kind;
drop table if exists app_public.daily_record_status;
drop table if exists app_public.daily_record_day_status;
drop trigger if exists _200_update_shared_daily_records on app_public.private_daily_records;
drop function if exists app_public.tg_update_shared_daily_records();
drop trigger if exists _300_pupcle_on_complete_daily_record on app_public.shared_daily_records;
drop function if exists app_public.tg_pupcle_on_complete_daily_record();
drop table if exists app_public.shared_daily_records;
drop table if exists app_public.private_daily_records;

--! split: 4010-pets.sql
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
  v_pupcle_balance integer;
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
      where user_id = NEW.user_id returning pupcle_balance into v_pupcle_balance;

      perform graphile_worker.add_job(
        'create_notification',
        json_build_object(
          'type', 'pupcle_reward_daily_status',
          'for_user_id', NEW.user_id,
          'reward', 1,
          'balance', v_pupcle_balance,
          'pet_id', NEW.pet_id,
          'day', NEW.day
        ));
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

--! split: 5000-poi-reset.sql
drop trigger if exists _100_timestamps on app_public.poi_favorites;
drop trigger if exists _100_timestamps on app_public.poi_reviews;
drop trigger if exists _200_poi_reviews_create_poi on app_public.poi_reviews;
drop function if exists app_public.tg__poi_reviews__create_poi();
drop trigger if exists _300_poi_reviews_check_kakao_id on app_public.poi_reviews;
drop function if exists app_public.tg__poi_reviews__check_kakao_id();
drop trigger if exists _400_poi_reviews_after_change on app_public.poi_reviews;
drop function if exists app_public.tg__poi_reviews__update_poi_on_review();
drop trigger if exists _100_timestamps on app_public.poi;
drop table if exists app_public.poi_favorites;
drop table if exists app_public.poi_reviews;
drop table if exists app_public.poi;

--! split: 5010-poi.sql
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

create or replace function app_public.tg__poi_related__create_or_replace_poi()
returns trigger as $$
begin
  if NEW.kakao_id is null then
    NEW.poi_id := null;
    return NEW;
  end if;

  -- when poi_id for the kakao_id is unknown, use zero UUID on create or on setting the kakao_id
  if NEW.poi_id = '00000000-0000-0000-0000-000000000000' then
    NEW.poi_id := null;
  end if;

  -- force update poi_id when kakao_id changes
  if tg_op = 'UPDATE' and OLD.kakao_id <> NEW.kakao_id then
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
  execute procedure app_public.tg__poi_related__create_or_replace_poi();
comment on function app_public.tg__poi_related__create_or_replace_poi() is
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

--! split: 5020-poi-favorites.sql
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

--! split: 6000-exams-reset.sql
drop table if exists app_public.exam_result_assets;
drop table if exists app_public.user_asset_kind;
drop trigger if exists _200_poi_exam_results_create_or_update_poi on app_public.exam_results;
drop trigger if exists _100_timestamps on app_public.exam_results;
drop trigger if exists _570_insert_exam_categories on app_public.users;
drop function if exists app_public.tg_exam_categories__insert_with_user();
drop trigger if exists _100_timestamps on app_public.exam_categories;
drop table if exists app_public.exam_results;
drop table if exists app_public.exam_categories;
drop type if exists app_public.money;

--! split: 6010-exams.sql
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
  insert into app_public.exam_categories(user_id, name, is_default_category, has_data, default_point_buckets) values(NEW.id, '기본혈액검사(CBC)', true, true, '[{"bucket":"WBC","type":"number","safeRangeStart":10,"safeRangeEnd":20,"tooltip":"White Blood Cell Count"},{"bucket":"WBC-Lymph","type":"number","safeRangeStart":1,"safeRangeEnd":10,"tooltip":"Wite Blood Cell Lymph"},{"bucket":"WBC-Gran","type":"number","safeRangeStart":5,"safeRangeEnd":15,"tooltip":"WBC-Gran"},{"bucket":"RBC","type":"number","safeRangeStart":5,"safeRangeEnd":10,"tooltip":"Red Blood Cell Count"},{"bucket":"HGB","type":"number","safeRangeStart":10,"tooltip":"HGB"},{"bucket":"HCT","type":"number","safeRangeStart":10,"safeRangeEnd":100,"tooltip":"HCT"},{"bucket":"MCV","type":"number","safeRangeStart":10,"safeRangeEnd":20,"tooltip":"MCV"},{"bucket":"MCH","type":"number","safeRangeStart":300,"safeRangeEnd":500,"tooltip":"MCH"},{"bucket":"MCHC","type":"number","safeRangeStart":10,"safeRangeEnd":100,"tooltip":"MCHC"},{"bucket":"RDW-CV","type":"number","safeRangeStart":10,"safeRangeEnd":20,"tooltip":"RDW-CV"}]'::jsonb) on conflict do nothing;
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

--! split: 7000-missions-reset.sql
drop trigger if exists _200_notification_on_mission_invite on app_public.mission_invites;
drop function if exists app_private.tg_notification_on_mission_invite();
drop trigger if exists _100_timestamps on app_public.mission_invites;
drop table if exists app_public.mission_invites;
drop trigger if exists _300_pupcles_on_complete_mission on app_public.mission_participants;
drop function if exists app_public.tg_pupcles_on_complete_mission();
drop trigger if exists _200_update_count_on_participate_mission on app_public.mission_participants;
drop function if exists app_public.tg_update_count_on_participant_mission();
drop trigger if exists _100_timestamps on app_public.mission_participants;
drop table if exists app_public.mission_participants;
-- drop table if exists app_public.mission_participant_assets;
drop trigger if exists _100_timestamps on app_public.missions;
drop table if exists app_public.missions;
drop table if exists app_public.mission_period_kind;

--! split: 7010-missions.sql
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
  v_pupcle_balance integer;
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
      where user_id = NEW.user_id returning pupcle_balance into v_pupcle_balance;

      perform graphile_worker.add_job(
        'create_notification',
        json_build_object(
          'type', 'pupcle_reward_mission',
          'for_user_id', NEW.user_id,
          'reward', v_mission.reward,
          'balance', v_pupcle_balance,
          'mission_id', NEW.mission_id
        ));
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

create function app_public.tg_notification_on_mission_invite() returns trigger as $$
declare
  v_new boolean;
begin
  if tg_when = 'AFTER' then
    v_new := false;
    if (TG_OP = 'INSERT') then
      v_new := true;
    end if;

    if v_new = true then
      perform graphile_worker.add_job(
        'create_notification',
        json_build_object(
          'type', 'received_mission_invite',
          'for_user_id', NEW.to_user_id,
          'from_user_id', NEW.from_user_id,
          'mission_id', NEW.mission_id
        ));
    end if;
  end if;
  return null;
end;
$$ language plpgsql volatile security definer set search_path to pg_catalog, public, pg_temp;

create trigger _200_notification_on_mission_invite
  after insert or update
  on app_public.mission_invites
  for each row
  execute procedure app_public.tg_notification_on_mission_invite();
comment on function app_public.tg_notification_on_mission_invite() is
  E'Send notification on mission invite';
