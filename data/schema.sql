--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5 (Debian 14.5-2.pgdg110+2)
-- Dumped by pg_dump version 15.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: app_hidden; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA app_hidden;


--
-- Name: app_private; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA app_private;


--
-- Name: app_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA app_public;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: money; Type: TYPE; Schema: app_public; Owner: -
--

CREATE TYPE app_public.money AS (
	currency text,
	amount text
);


--
-- Name: weight_unit; Type: TYPE; Schema: app_public; Owner: -
--

CREATE TYPE app_public.weight_unit AS ENUM (
    'kg',
    'lbs'
);


--
-- Name: weight; Type: TYPE; Schema: app_public; Owner: -
--

CREATE TYPE app_public.weight AS (
	unit app_public.weight_unit,
	value double precision
);


--
-- Name: assert_valid_password(text); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.assert_valid_password(new_password text) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  -- TODO: add better assertions!
  if length(new_password) < 8 then
    raise exception 'Password is too weak' using errcode = 'WEAKP';
  end if;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username public.citext NOT NULL,
    nickname text,
    avatar_url text,
    is_admin boolean DEFAULT false NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_avatar_url_check CHECK ((avatar_url ~ '^https?://[^/]+'::text)),
    CONSTRAINT users_username_check CHECK (((length((username)::text) >= 2) AND (length((username)::text) <= 24) AND (username OPERATOR(public.~) '^[a-zA-Z]([_]?[a-zA-Z0-9])+$'::public.citext)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON TABLE app_public.users IS 'A user who can log in to the application.';


--
-- Name: COLUMN users.id; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.users.id IS 'Unique identifier for the user.';


--
-- Name: COLUMN users.username; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.users.username IS 'Public-facing username (or ''handle'') of the user.';


--
-- Name: COLUMN users.nickname; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.users.nickname IS 'Public-facing nickname (or pseudonym) of the user.';


--
-- Name: COLUMN users.avatar_url; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.users.avatar_url IS 'Optional avatar URL.';


--
-- Name: COLUMN users.is_admin; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.users.is_admin IS 'If true, the user has elevated privileges.';


--
-- Name: link_or_register_user(uuid, character varying, character varying, json, json); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.link_or_register_user(f_user_id uuid, f_service character varying, f_identifier character varying, f_profile json, f_auth_details json) RETURNS app_public.users
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION link_or_register_user(f_user_id uuid, f_service character varying, f_identifier character varying, f_profile json, f_auth_details json); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.link_or_register_user(f_user_id uuid, f_service character varying, f_identifier character varying, f_profile json, f_auth_details json) IS 'If you''re logged in, this will link an additional OAuth login to your account if necessary. If you''re logged out it may find if an account already exists (based on OAuth details or email address) and return that, or create a new user account if necessary.';


--
-- Name: sessions; Type: TABLE; Schema: app_private; Owner: -
--

CREATE TABLE app_private.sessions (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_active timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: login(public.citext, text); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.login(username public.citext, password text) RETURNS app_private.sessions
    LANGUAGE plpgsql STRICT
    AS $$
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
$$;


--
-- Name: FUNCTION login(username public.citext, password text); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.login(username public.citext, password text) IS 'Returns a user that matches the username/password combo, or null on failure.';


--
-- Name: really_create_user(public.citext, text, boolean, text, text, text); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.really_create_user(username public.citext, email text, email_is_verified boolean, nickname text, avatar_url text, password text DEFAULT NULL::text) RETURNS app_public.users
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION really_create_user(username public.citext, email text, email_is_verified boolean, nickname text, avatar_url text, password text); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.really_create_user(username public.citext, email text, email_is_verified boolean, nickname text, avatar_url text, password text) IS 'Creates a user account. All arguments are optional, it trusts the calling method to perform sanitisation.';


--
-- Name: register_user(character varying, character varying, json, json, boolean); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.register_user(f_service character varying, f_identifier character varying, f_profile json, f_auth_details json, f_email_is_verified boolean DEFAULT false) RETURNS app_public.users
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION register_user(f_service character varying, f_identifier character varying, f_profile json, f_auth_details json, f_email_is_verified boolean); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.register_user(f_service character varying, f_identifier character varying, f_profile json, f_auth_details json, f_email_is_verified boolean) IS 'Used to register a user from information gleaned from OAuth. Primarily used by link_or_register_user';


--
-- Name: reset_password(uuid, text, text); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.reset_password(user_id uuid, reset_token text, new_password text) RETURNS boolean
    LANGUAGE plpgsql STRICT
    AS $$
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
$$;


--
-- Name: tg__add_audit_job(); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.tg__add_audit_job() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
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
$_$;


--
-- Name: FUNCTION tg__add_audit_job(); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.tg__add_audit_job() IS 'For notifying a user that an auditable action has taken place. Call with audit event name, user ID attribute name, and optionally another value to be included (e.g. the PK of the table, or some other relevant information). e.g. `tg__add_audit_job(''added_email'', ''user_id'', ''email'')`';


--
-- Name: tg__add_job(); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.tg__add_job() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  perform graphile_worker.add_job(tg_argv[0], json_build_object('id', NEW.id));
  return NEW;
end;
$$;


--
-- Name: FUNCTION tg__add_job(); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.tg__add_job() IS 'Useful shortcut to create a job on insert/update. Pass the task name as the first trigger argument, and optionally the queue name as the second argument. The record id will automatically be available on the JSON payload.';


--
-- Name: tg__timestamps(); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.tg__timestamps() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  NEW.created_at = (case when TG_OP = 'INSERT' then NOW() else OLD.created_at end);
  NEW.updated_at = (case when TG_OP = 'UPDATE' and OLD.updated_at >= NOW() then OLD.updated_at + interval '1 millisecond' else NOW() end);
  return NEW;
end;
$$;


--
-- Name: FUNCTION tg__timestamps(); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.tg__timestamps() IS 'This trigger should be called on all tables with created_at, updated_at - it ensures that they cannot be manipulated and that updated_at will always be larger than the previous updated_at.';


--
-- Name: tg_user_email_secrets__insert_with_user_email(); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.tg_user_email_secrets__insert_with_user_email() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
declare
  v_verification_token text;
begin
  if NEW.is_verified is false then
    v_verification_token = encode(gen_random_bytes(7), 'hex');
  end if;
  insert into app_private.user_email_secrets(user_email_id, verification_token) values(NEW.id, v_verification_token);
  return NEW;
end;
$$;


--
-- Name: FUNCTION tg_user_email_secrets__insert_with_user_email(); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.tg_user_email_secrets__insert_with_user_email() IS 'Ensures that every user_email record has an associated user_email_secret record.';


--
-- Name: tg_user_secrets__insert_with_user(); Type: FUNCTION; Schema: app_private; Owner: -
--

CREATE FUNCTION app_private.tg_user_secrets__insert_with_user() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  insert into app_private.user_secrets(user_id) values(NEW.id);
  return NEW;
end;
$$;


--
-- Name: FUNCTION tg_user_secrets__insert_with_user(); Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON FUNCTION app_private.tg_user_secrets__insert_with_user() IS 'Ensures that every user record has an associated user_secret record.';


--
-- Name: accept_invitation_to_organization(uuid, text); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.accept_invitation_to_organization(invitation_id uuid, code text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: change_password(text, text); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.change_password(old_password text, new_password text) RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION change_password(old_password text, new_password text); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.change_password(old_password text, new_password text) IS 'Enter your old password and a new password to change your password.';


--
-- Name: confirm_account_deletion(text); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.confirm_account_deletion(token text) RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION confirm_account_deletion(token text); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.confirm_account_deletion(token text) IS 'If you''re certain you want to delete your account, use `requestAccountDeletion` to request an account deletion token, and then supply the token through this mutation to complete account deletion.';


--
-- Name: organizations; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug public.citext NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: create_organization(public.citext, text); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.create_organization(slug public.citext, name text) RETURNS app_public.organizations
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: current_session_id(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.current_session_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select nullif(pg_catalog.current_setting('jwt.claims.session_id', true), '')::uuid;
$$;


--
-- Name: FUNCTION current_session_id(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.current_session_id() IS 'Handy method to get the current session ID.';


--
-- Name: current_user(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public."current_user"() RETURNS app_public.users
    LANGUAGE sql STABLE
    AS $$
  select users.* from app_public.users where id = app_public.current_user_id();
$$;


--
-- Name: FUNCTION "current_user"(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public."current_user"() IS 'The currently logged in user (or null if not logged in).';


--
-- Name: current_user_id(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.current_user_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
  select user_id from app_private.sessions where uuid = app_public.current_session_id();
$$;


--
-- Name: FUNCTION current_user_id(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.current_user_id() IS 'Handy method to get the current user ID for use in RLS policies, etc; in GraphQL, use `currentUser{id}` instead.';


--
-- Name: current_user_invited_organization_ids(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.current_user_invited_organization_ids() RETURNS SETOF uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
  select organization_id from app_public.organization_invitations
    where user_id = app_public.current_user_id();
$$;


--
-- Name: current_user_member_organization_ids(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.current_user_member_organization_ids() RETURNS SETOF uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
  select organization_id from app_public.organization_memberships
    where user_id = app_public.current_user_id();
$$;


--
-- Name: current_user_shared_friend_ids(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.current_user_shared_friend_ids() RETURNS SETOF uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
  select to_user_id from app_public.user_edges
    where from_user_id = app_public.current_user_id() and daily_records_shared = 'SUMMARY';
$$;


--
-- Name: delete_organization(uuid); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.delete_organization(organization_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: forgot_password(public.citext); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.forgot_password(email public.citext) RETURNS void
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION forgot_password(email public.citext); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.forgot_password(email public.citext) IS 'If you''ve forgotten your password, give us one of your email addresses and we''ll send you a reset token. Note this only works if you have added an email address!';


--
-- Name: invite_to_organization(uuid, public.citext, public.citext); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.invite_to_organization(organization_id uuid, username public.citext DEFAULT NULL::public.citext, email public.citext DEFAULT NULL::public.citext) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: logout(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.logout() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  -- Delete the session
  delete from app_private.sessions where uuid = app_public.current_session_id();
  -- Clear the identifier from the transaction
  perform set_config('jwt.claims.session_id', '', true);
end;
$$;


--
-- Name: user_emails; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.user_emails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT app_public.current_user_id() NOT NULL,
    email public.citext NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_emails_email_check CHECK ((email OPERATOR(public.~) '[^@]+@[^@]+\.[^@]+'::public.citext)),
    CONSTRAINT user_emails_must_be_verified_to_be_primary CHECK (((is_primary IS FALSE) OR (is_verified IS TRUE)))
);


--
-- Name: TABLE user_emails; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON TABLE app_public.user_emails IS 'Information about a user''s email address.';


--
-- Name: COLUMN user_emails.email; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.user_emails.email IS 'The users email address, in `a@b.c` format.';


--
-- Name: COLUMN user_emails.is_verified; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.user_emails.is_verified IS 'True if the user has is_verified their email address (by clicking the link in the email we sent them, or logging in with a social login provider), false otherwise.';


--
-- Name: make_email_primary(uuid); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.make_email_primary(email_id uuid) RETURNS app_public.user_emails
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION make_email_primary(email_id uuid); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.make_email_primary(email_id uuid) IS 'Your primary email is where we''ll notify of account events; other emails may be used for discovery or login. Use this when you''re changing your email address.';


--
-- Name: organization_for_invitation(uuid, text); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.organization_for_invitation(invitation_id uuid, code text DEFAULT NULL::text) RETURNS app_public.organizations
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: organizations_current_user_is_billing_contact(app_public.organizations); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.organizations_current_user_is_billing_contact(org app_public.organizations) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists(
    select 1
    from app_public.organization_memberships
    where organization_id = org.id
    and user_id = app_public.current_user_id()
    and is_billing_contact is true
  )
$$;


--
-- Name: organizations_current_user_is_owner(app_public.organizations); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.organizations_current_user_is_owner(org app_public.organizations) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists(
    select 1
    from app_public.organization_memberships
    where organization_id = org.id
    and user_id = app_public.current_user_id()
    and is_owner is true
  )
$$;


--
-- Name: remove_from_organization(uuid, uuid); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.remove_from_organization(organization_id uuid, user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: request_account_deletion(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.request_account_deletion() RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION request_account_deletion(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.request_account_deletion() IS 'Begin the account deletion flow by requesting the confirmation email';


--
-- Name: resend_email_verification_code(uuid); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.resend_email_verification_code(email_id uuid) RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION resend_email_verification_code(email_id uuid); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.resend_email_verification_code(email_id uuid) IS 'If you didn''t receive the verification code for this email, we can resend it. We silently cap the rate of resends on the backend, so calls to this function may not result in another email being sent if it has been called recently.';


--
-- Name: tg__graphql_subscription(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg__graphql_subscription() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
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
$_$;


--
-- Name: FUNCTION tg__graphql_subscription(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.tg__graphql_subscription() IS 'This function enables the creation of simple focussed GraphQL subscriptions using database triggers. Read more here: https://www.graphile.org/postgraphile/subscriptions/#custom-subscriptions';


--
-- Name: tg__poi_related__create_or_replace_poi(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg__poi_related__create_or_replace_poi() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION tg__poi_related__create_or_replace_poi(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.tg__poi_related__create_or_replace_poi() IS 'Sets a poi for this poi related object';


--
-- Name: tg__poi_reviews__check_kakao_id(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg__poi_reviews__check_kakao_id() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  if NEW.kakao_id <> OLD.kakao_id then
    raise exception 'cannot change kakao_id';
  end if;

  if NEW.poi_id <> OLD.poi_id then
    raise exception 'cannot change poi_id';
  end if;
  return new;
end;
$$;


--
-- Name: FUNCTION tg__poi_reviews__check_kakao_id(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.tg__poi_reviews__check_kakao_id() IS 'Checks that the kakao id is not changing on a poi review';


--
-- Name: tg__poi_reviews__update_poi_on_review(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg__poi_reviews__update_poi_on_review() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION tg__poi_reviews__update_poi_on_review(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.tg__poi_reviews__update_poi_on_review() IS 'Updates a poi''s rating and reviews aggregates when a poi review is inserted or updated.';


--
-- Name: tg_exam_categories__insert_with_user(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg_exam_categories__insert_with_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '치과 검진', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '슬개골 검사', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '피부 검사', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '심장 청진', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category) values(NEW.id, '신체 검사', true) on conflict do nothing;
  insert into app_public.exam_categories(user_id, name, is_default_category, has_data, default_point_buckets) values(NEW.id, '기본혈액검사(CBC)', true, true, '[{"bucket":"WBC","type":"number","safeRangeStart":10,"safeRangeEnd":20,"tooltip":"White Blood Cell Count"},{"bucket":"WBC-Lymph","type":"number","safeRangeStart":1,"safeRangeEnd":10,"tooltip":"Wite Blood Cell Lymph"},{"bucket":"WBC-Gran","type":"number","safeRangeStart":5,"safeRangeEnd":15,"tooltip":"WBC-Gran"},{"bucket":"RBC","type":"number","safeRangeStart":5,"safeRangeEnd":10,"tooltip":"Red Blood Cell Count"},{"bucket":"HGB","type":"number","safeRangeStart":10,"tooltip":"HGB"},{"bucket":"HCT","type":"number","safeRangeStart":10,"safeRangeEnd":100,"tooltip":"HCT"},{"bucket":"MCV","type":"number","safeRangeStart":10,"safeRangeEnd":20,"tooltip":"MCV"},{"bucket":"MCH","type":"number","safeRangeStart":300,"safeRangeEnd":500,"tooltip":"MCH"},{"bucket":"MCHC","type":"number","safeRangeStart":10,"safeRangeEnd":100,"tooltip":"MCHC"},{"bucket":"RDW-CV","type":"number","safeRangeStart":10,"safeRangeEnd":20,"tooltip":"RDW-CV"}]'::jsonb) on conflict do nothing;
  return NEW;
end;
$$;


--
-- Name: FUNCTION tg_exam_categories__insert_with_user(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.tg_exam_categories__insert_with_user() IS 'Ensures that every user has their own set of basic exam categories.';


--
-- Name: tg_pupcle_on_complete_daily_record(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg_pupcle_on_complete_daily_record() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION tg_pupcle_on_complete_daily_record(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.tg_pupcle_on_complete_daily_record() IS 'Gives a pupcle to the user when the user completes a pet''s daily record';


--
-- Name: tg_update_shared_daily_records(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg_update_shared_daily_records() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION tg_update_shared_daily_records(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.tg_update_shared_daily_records() IS 'Ensures that shared_daily_records is up to date when the user updates their private_daily_records.';


--
-- Name: tg_user_edges__unfriend(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg_user_edges__unfriend() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  delete from app_public.user_edges where from_user_id = OLD.to_user_id and to_user_id = OLD.from_user_id;
  return null;
end;
$$;


--
-- Name: FUNCTION tg_user_edges__unfriend(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.tg_user_edges__unfriend() IS 'Ensures that when user A unfriends user B, user B unfriends user A.';


--
-- Name: tg_user_emails__forbid_if_verified(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg_user_emails__forbid_if_verified() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  if exists(select 1 from app_public.user_emails where email = NEW.email and is_verified is true) then
    raise exception 'An account using that email address has already been created.' using errcode='EMTKN';
  end if;
  return NEW;
end;
$$;


--
-- Name: tg_user_emails__prevent_delete_last_email(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg_user_emails__prevent_delete_last_email() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: tg_user_emails__verify_account_on_verified(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg_user_emails__verify_account_on_verified() RETURNS trigger
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  update app_public.users set is_verified = true where id = new.user_id and is_verified is false;
  return new;
end;
$$;


--
-- Name: tg_user_entries__insert_with_user(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg_user_entries__insert_with_user() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  insert into app_public.user_entries(user_id) values(NEW.id) on conflict do nothing;
  return NEW;
end;
$$;


--
-- Name: FUNCTION tg_user_entries__insert_with_user(); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.tg_user_entries__insert_with_user() IS 'Ensures that every user record has an associated user_entries record.';


--
-- Name: tg_users__deletion_organization_checks_and_actions(); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.tg_users__deletion_organization_checks_and_actions() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: transfer_organization_billing_contact(uuid, uuid); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.transfer_organization_billing_contact(organization_id uuid, user_id uuid) RETURNS app_public.organizations
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: transfer_organization_ownership(uuid, uuid); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.transfer_organization_ownership(organization_id uuid, user_id uuid) RETURNS app_public.organizations
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: users_has_password(app_public.users); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.users_has_password(u app_public.users) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
  select (password_hash is not null) from app_private.user_secrets where user_secrets.user_id = u.id and u.id = app_public.current_user_id();
$$;


--
-- Name: verify_email(uuid, text); Type: FUNCTION; Schema: app_public; Owner: -
--

CREATE FUNCTION app_public.verify_email(user_email_id uuid, token text) RETURNS boolean
    LANGUAGE plpgsql STRICT SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION verify_email(user_email_id uuid, token text); Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON FUNCTION app_public.verify_email(user_email_id uuid, token text) IS 'Once you have received a verification token for your email, you may call this mutation with that token to make your email verified.';


--
-- Name: connect_pg_simple_sessions; Type: TABLE; Schema: app_private; Owner: -
--

CREATE TABLE app_private.connect_pg_simple_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: unregistered_email_password_resets; Type: TABLE; Schema: app_private; Owner: -
--

CREATE TABLE app_private.unregistered_email_password_resets (
    email public.citext NOT NULL,
    attempts integer DEFAULT 1 NOT NULL,
    latest_attempt timestamp with time zone NOT NULL
);


--
-- Name: TABLE unregistered_email_password_resets; Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON TABLE app_private.unregistered_email_password_resets IS 'If someone tries to recover the password for an email that is not registered in our system, this table enables us to rate-limit outgoing emails to avoid spamming.';


--
-- Name: COLUMN unregistered_email_password_resets.attempts; Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON COLUMN app_private.unregistered_email_password_resets.attempts IS 'We store the number of attempts to help us detect accounts being attacked.';


--
-- Name: COLUMN unregistered_email_password_resets.latest_attempt; Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON COLUMN app_private.unregistered_email_password_resets.latest_attempt IS 'We store the time the last password reset was sent to this email to prevent the email getting flooded.';


--
-- Name: user_authentication_secrets; Type: TABLE; Schema: app_private; Owner: -
--

CREATE TABLE app_private.user_authentication_secrets (
    user_authentication_id uuid NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: user_email_secrets; Type: TABLE; Schema: app_private; Owner: -
--

CREATE TABLE app_private.user_email_secrets (
    user_email_id uuid NOT NULL,
    verification_token text,
    verification_email_sent_at timestamp with time zone,
    password_reset_email_sent_at timestamp with time zone
);


--
-- Name: TABLE user_email_secrets; Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON TABLE app_private.user_email_secrets IS 'The contents of this table should never be visible to the user. Contains data mostly related to email verification and avoiding spamming users.';


--
-- Name: COLUMN user_email_secrets.password_reset_email_sent_at; Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON COLUMN app_private.user_email_secrets.password_reset_email_sent_at IS 'We store the time the last password reset was sent to this email to prevent the email getting flooded.';


--
-- Name: user_secrets; Type: TABLE; Schema: app_private; Owner: -
--

CREATE TABLE app_private.user_secrets (
    user_id uuid NOT NULL,
    password_hash text,
    last_login_at timestamp with time zone DEFAULT now() NOT NULL,
    failed_password_attempts integer DEFAULT 0 NOT NULL,
    first_failed_password_attempt timestamp with time zone,
    reset_password_token text,
    reset_password_token_generated timestamp with time zone,
    failed_reset_password_attempts integer DEFAULT 0 NOT NULL,
    first_failed_reset_password_attempt timestamp with time zone,
    delete_account_token text,
    delete_account_token_generated timestamp with time zone
);


--
-- Name: TABLE user_secrets; Type: COMMENT; Schema: app_private; Owner: -
--

COMMENT ON TABLE app_private.user_secrets IS 'The contents of this table should never be visible to the user. Contains data mostly related to authentication.';


--
-- Name: daily_record_day_status; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.daily_record_day_status (
    status text NOT NULL,
    description text
);


--
-- Name: TABLE daily_record_day_status; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON TABLE app_public.daily_record_day_status IS '@enum';


--
-- Name: daily_record_status; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.daily_record_status (
    status text NOT NULL,
    description text
);


--
-- Name: TABLE daily_record_status; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON TABLE app_public.daily_record_status IS '@enum';


--
-- Name: exam_categories; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.exam_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    is_default_category boolean DEFAULT false NOT NULL,
    has_data boolean DEFAULT false NOT NULL,
    default_point_buckets jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exam_result_assets; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.exam_result_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_result_id uuid NOT NULL,
    kind text NOT NULL,
    asset_url text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT exam_result_assets_asset_url_check CHECK ((asset_url ~ '^https?://[^/]+'::text))
);


--
-- Name: exam_results; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.exam_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pet_id uuid NOT NULL,
    exam_category_id uuid NOT NULL,
    taken_at timestamp with time zone,
    cost app_public.money,
    poi_id uuid,
    kakao_id character varying(255),
    next_reservation timestamp with time zone,
    memo text,
    exam_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sort_datetime timestamp with time zone GENERATED ALWAYS AS (COALESCE(taken_at, created_at)) STORED
);


--
-- Name: friend_requests; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.friend_requests (
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: organization_invitations; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.organization_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    code text,
    user_id uuid,
    email public.citext,
    CONSTRAINT organization_invitations_check CHECK (((user_id IS NULL) <> (email IS NULL))),
    CONSTRAINT organization_invitations_check1 CHECK (((code IS NULL) = (email IS NULL)))
);


--
-- Name: organization_memberships; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.organization_memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_owner boolean DEFAULT false NOT NULL,
    is_billing_contact boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pet_gender; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.pet_gender (
    gender text NOT NULL,
    description text
);


--
-- Name: TABLE pet_gender; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON TABLE app_public.pet_gender IS '@enum';


--
-- Name: pet_kind; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.pet_kind (
    kind text NOT NULL,
    description text
);


--
-- Name: TABLE pet_kind; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON TABLE app_public.pet_kind IS '@enum';


--
-- Name: pets; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.pets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    kind text NOT NULL,
    name text NOT NULL,
    gender text NOT NULL,
    dob date NOT NULL,
    weight app_public.weight,
    neutered boolean NOT NULL,
    avatar_url text,
    vaccinations jsonb,
    injections jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pets_avatar_url_check CHECK ((avatar_url ~ '^https?://[^/]+'::text))
);


--
-- Name: poi; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.poi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kakao_id character varying(255) NOT NULL,
    rating double precision NOT NULL,
    total_rating integer NOT NULL,
    rating_count integer NOT NULL,
    review_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: poi_favorites; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.poi_favorites (
    user_id uuid NOT NULL,
    poi_id uuid NOT NULL,
    kakao_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: poi_reviews; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.poi_reviews (
    poi_id uuid NOT NULL,
    user_id uuid NOT NULL,
    kakao_id character varying(255) NOT NULL,
    comment text,
    rating integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT poi_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 10)))
);


--
-- Name: private_daily_records; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.private_daily_records (
    user_id uuid NOT NULL,
    pet_id uuid NOT NULL,
    day date NOT NULL,
    sleep_status text,
    sleep_comment text,
    diet_status text,
    diet_comment text,
    walking_status text,
    walking_comment text,
    play_status text,
    play_comment text,
    bathroom_status text,
    bathroom_comment text,
    health_status text,
    health_comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: share_level; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.share_level (
    level text NOT NULL,
    description text
);


--
-- Name: TABLE share_level; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON TABLE app_public.share_level IS '@enum';


--
-- Name: shared_daily_records; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.shared_daily_records (
    user_id uuid NOT NULL,
    pet_id uuid NOT NULL,
    day date NOT NULL,
    day_status text NOT NULL,
    is_complete boolean DEFAULT false NOT NULL,
    ever_completed boolean DEFAULT false NOT NULL,
    complete_status_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_asset_kind; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.user_asset_kind (
    kind text NOT NULL,
    description text
);


--
-- Name: TABLE user_asset_kind; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON TABLE app_public.user_asset_kind IS '@enum';


--
-- Name: user_authentications; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.user_authentications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service text NOT NULL,
    identifier text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE user_authentications; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON TABLE app_public.user_authentications IS 'Contains information about the login providers this user has used, so that they may disconnect them should they wish.';


--
-- Name: COLUMN user_authentications.service; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.user_authentications.service IS 'The login service used, e.g. `twitter` or `github`.';


--
-- Name: COLUMN user_authentications.identifier; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.user_authentications.identifier IS 'A unique identifier for the user within the login service.';


--
-- Name: COLUMN user_authentications.details; Type: COMMENT; Schema: app_public; Owner: -
--

COMMENT ON COLUMN app_public.user_authentications.details IS 'Additional profile details extracted from this login method';


--
-- Name: user_edges; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.user_edges (
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    daily_records_shared text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_entries; Type: TABLE; Schema: app_public; Owner: -
--

CREATE TABLE app_public.user_entries (
    user_id uuid NOT NULL,
    name text,
    pupcle_balance integer DEFAULT 0 NOT NULL,
    total_pupcles_earned integer DEFAULT 0 NOT NULL,
    address jsonb,
    agreed_to_terms boolean DEFAULT false NOT NULL,
    receive_general_notifications boolean DEFAULT true NOT NULL,
    receive_marketing_notifications boolean DEFAULT true NOT NULL,
    receive_personal_notifications boolean DEFAULT true NOT NULL,
    receive_friend_request_notifications boolean DEFAULT true NOT NULL,
    receive_invite_notifications boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: connect_pg_simple_sessions session_pkey; Type: CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.connect_pg_simple_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (uuid);


--
-- Name: unregistered_email_password_resets unregistered_email_pkey; Type: CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.unregistered_email_password_resets
    ADD CONSTRAINT unregistered_email_pkey PRIMARY KEY (email);


--
-- Name: user_authentication_secrets user_authentication_secrets_pkey; Type: CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.user_authentication_secrets
    ADD CONSTRAINT user_authentication_secrets_pkey PRIMARY KEY (user_authentication_id);


--
-- Name: user_email_secrets user_email_secrets_pkey; Type: CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.user_email_secrets
    ADD CONSTRAINT user_email_secrets_pkey PRIMARY KEY (user_email_id);


--
-- Name: user_secrets user_secrets_pkey; Type: CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.user_secrets
    ADD CONSTRAINT user_secrets_pkey PRIMARY KEY (user_id);


--
-- Name: daily_record_day_status daily_record_day_status_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.daily_record_day_status
    ADD CONSTRAINT daily_record_day_status_pkey PRIMARY KEY (status);


--
-- Name: daily_record_status daily_record_status_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.daily_record_status
    ADD CONSTRAINT daily_record_status_pkey PRIMARY KEY (status);


--
-- Name: exam_categories exam_categories_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_categories
    ADD CONSTRAINT exam_categories_pkey PRIMARY KEY (id);


--
-- Name: exam_categories exam_categories_user_id_name_key; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_categories
    ADD CONSTRAINT exam_categories_user_id_name_key UNIQUE (user_id, name);


--
-- Name: exam_result_assets exam_result_assets_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_result_assets
    ADD CONSTRAINT exam_result_assets_pkey PRIMARY KEY (id);


--
-- Name: exam_results exam_results_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_results
    ADD CONSTRAINT exam_results_pkey PRIMARY KEY (id);


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (from_user_id, to_user_id);


--
-- Name: organization_invitations organization_invitations_organization_id_email_key; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organization_invitations
    ADD CONSTRAINT organization_invitations_organization_id_email_key UNIQUE (organization_id, email);


--
-- Name: organization_invitations organization_invitations_organization_id_user_id_key; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organization_invitations
    ADD CONSTRAINT organization_invitations_organization_id_user_id_key UNIQUE (organization_id, user_id);


--
-- Name: organization_invitations organization_invitations_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organization_invitations
    ADD CONSTRAINT organization_invitations_pkey PRIMARY KEY (id);


--
-- Name: organization_memberships organization_memberships_organization_id_user_id_key; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organization_memberships
    ADD CONSTRAINT organization_memberships_organization_id_user_id_key UNIQUE (organization_id, user_id);


--
-- Name: organization_memberships organization_memberships_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organization_memberships
    ADD CONSTRAINT organization_memberships_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: pet_gender pet_gender_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.pet_gender
    ADD CONSTRAINT pet_gender_pkey PRIMARY KEY (gender);


--
-- Name: pet_kind pet_kind_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.pet_kind
    ADD CONSTRAINT pet_kind_pkey PRIMARY KEY (kind);


--
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (id);


--
-- Name: poi_favorites poi_favorites_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.poi_favorites
    ADD CONSTRAINT poi_favorites_pkey PRIMARY KEY (user_id, poi_id);


--
-- Name: poi poi_kakao_id_key; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.poi
    ADD CONSTRAINT poi_kakao_id_key UNIQUE (kakao_id);


--
-- Name: poi poi_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.poi
    ADD CONSTRAINT poi_pkey PRIMARY KEY (id);


--
-- Name: poi_reviews poi_reviews_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.poi_reviews
    ADD CONSTRAINT poi_reviews_pkey PRIMARY KEY (user_id, poi_id);


--
-- Name: private_daily_records private_daily_records_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.private_daily_records
    ADD CONSTRAINT private_daily_records_pkey PRIMARY KEY (user_id, pet_id, day);


--
-- Name: share_level share_level_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.share_level
    ADD CONSTRAINT share_level_pkey PRIMARY KEY (level);


--
-- Name: shared_daily_records shared_daily_records_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.shared_daily_records
    ADD CONSTRAINT shared_daily_records_pkey PRIMARY KEY (user_id, pet_id, day);


--
-- Name: user_authentications uniq_user_authentications; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_authentications
    ADD CONSTRAINT uniq_user_authentications UNIQUE (service, identifier);


--
-- Name: user_asset_kind user_asset_kind_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_asset_kind
    ADD CONSTRAINT user_asset_kind_pkey PRIMARY KEY (kind);


--
-- Name: user_authentications user_authentications_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_authentications
    ADD CONSTRAINT user_authentications_pkey PRIMARY KEY (id);


--
-- Name: user_edges user_edges_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_edges
    ADD CONSTRAINT user_edges_pkey PRIMARY KEY (from_user_id, to_user_id);


--
-- Name: user_emails user_emails_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_emails
    ADD CONSTRAINT user_emails_pkey PRIMARY KEY (id);


--
-- Name: user_emails user_emails_user_id_email_key; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_emails
    ADD CONSTRAINT user_emails_user_id_email_key UNIQUE (user_id, email);


--
-- Name: user_entries user_entries_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_entries
    ADD CONSTRAINT user_entries_pkey PRIMARY KEY (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: app_private; Owner: -
--

CREATE INDEX sessions_user_id_idx ON app_private.sessions USING btree (user_id);


--
-- Name: exam_categories_name_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX exam_categories_name_idx ON app_public.exam_categories USING btree (name);


--
-- Name: exam_result_assets_exam_result_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX exam_result_assets_exam_result_id_idx ON app_public.exam_result_assets USING btree (exam_result_id);


--
-- Name: exam_result_assets_user_id_exam_result_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX exam_result_assets_user_id_exam_result_id_idx ON app_public.exam_result_assets USING btree (user_id, exam_result_id);


--
-- Name: exam_results_exam_category_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX exam_results_exam_category_id_idx ON app_public.exam_results USING btree (exam_category_id);


--
-- Name: exam_results_pet_id_sort_datetime_exam_category_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX exam_results_pet_id_sort_datetime_exam_category_id_idx ON app_public.exam_results USING btree (pet_id, sort_datetime, exam_category_id);


--
-- Name: exam_results_sort_datetime_exam_category_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX exam_results_sort_datetime_exam_category_id_idx ON app_public.exam_results USING btree (sort_datetime, exam_category_id);


--
-- Name: exam_results_user_id_pet_id_sort_datetime_exam_category_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX exam_results_user_id_pet_id_sort_datetime_exam_category_id_idx ON app_public.exam_results USING btree (user_id, pet_id, sort_datetime, exam_category_id);


--
-- Name: friend_requests_to_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX friend_requests_to_user_id_idx ON app_public.friend_requests USING btree (to_user_id);


--
-- Name: idx_user_emails_primary; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX idx_user_emails_primary ON app_public.user_emails USING btree (is_primary, user_id);


--
-- Name: idx_user_emails_user; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX idx_user_emails_user ON app_public.user_emails USING btree (user_id);


--
-- Name: organization_invitations_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX organization_invitations_user_id_idx ON app_public.organization_invitations USING btree (user_id);


--
-- Name: organization_memberships_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX organization_memberships_user_id_idx ON app_public.organization_memberships USING btree (user_id);


--
-- Name: pets_kind_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX pets_kind_idx ON app_public.pets USING btree (kind);


--
-- Name: pets_user_id_kind_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX pets_user_id_kind_idx ON app_public.pets USING btree (user_id, kind);


--
-- Name: poi_favorites_kakao_id_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX poi_favorites_kakao_id_user_id_idx ON app_public.poi_favorites USING btree (kakao_id, user_id);


--
-- Name: poi_favorites_poi_id_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX poi_favorites_poi_id_user_id_idx ON app_public.poi_favorites USING btree (poi_id, user_id);


--
-- Name: poi_favorites_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX poi_favorites_user_id_idx ON app_public.poi_favorites USING btree (user_id);


--
-- Name: poi_reviews_kakao_id_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX poi_reviews_kakao_id_user_id_idx ON app_public.poi_reviews USING btree (kakao_id, user_id);


--
-- Name: poi_reviews_poi_id_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX poi_reviews_poi_id_user_id_idx ON app_public.poi_reviews USING btree (poi_id, user_id);


--
-- Name: poi_reviews_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX poi_reviews_user_id_idx ON app_public.poi_reviews USING btree (user_id);


--
-- Name: private_daily_records_day_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX private_daily_records_day_idx ON app_public.private_daily_records USING btree (day);


--
-- Name: private_daily_records_pet_id_day_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX private_daily_records_pet_id_day_idx ON app_public.private_daily_records USING btree (pet_id, day);


--
-- Name: private_daily_records_user_id_pet_id_day_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX private_daily_records_user_id_pet_id_day_idx ON app_public.private_daily_records USING btree (user_id, pet_id, day);


--
-- Name: shared_daily_records_day_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX shared_daily_records_day_idx ON app_public.shared_daily_records USING btree (day);


--
-- Name: shared_daily_records_pet_id_day_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX shared_daily_records_pet_id_day_idx ON app_public.shared_daily_records USING btree (pet_id, day);


--
-- Name: shared_daily_records_user_id_pet_id_day_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX shared_daily_records_user_id_pet_id_day_idx ON app_public.shared_daily_records USING btree (user_id, pet_id, day);


--
-- Name: uniq_user_emails_primary_email; Type: INDEX; Schema: app_public; Owner: -
--

CREATE UNIQUE INDEX uniq_user_emails_primary_email ON app_public.user_emails USING btree (user_id) WHERE (is_primary IS TRUE);


--
-- Name: uniq_user_emails_verified_email; Type: INDEX; Schema: app_public; Owner: -
--

CREATE UNIQUE INDEX uniq_user_emails_verified_email ON app_public.user_emails USING btree (email) WHERE (is_verified IS TRUE);


--
-- Name: user_authentications_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX user_authentications_user_id_idx ON app_public.user_authentications USING btree (user_id);


--
-- Name: user_edges_daily_records_shared_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX user_edges_daily_records_shared_idx ON app_public.user_edges USING btree (daily_records_shared);


--
-- Name: user_edges_from_user_id_daily_records_shared_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX user_edges_from_user_id_daily_records_shared_idx ON app_public.user_edges USING btree (from_user_id, daily_records_shared);


--
-- Name: user_edges_to_user_id_idx; Type: INDEX; Schema: app_public; Owner: -
--

CREATE INDEX user_edges_to_user_id_idx ON app_public.user_edges USING btree (to_user_id);


--
-- Name: exam_categories _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.exam_categories FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: exam_result_assets _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.exam_result_assets FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: exam_results _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.exam_results FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: friend_requests _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.friend_requests FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: poi _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.poi FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: poi_favorites _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.poi_favorites FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: poi_reviews _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.poi_reviews FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: private_daily_records _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.private_daily_records FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: shared_daily_records _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.shared_daily_records FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: user_authentications _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.user_authentications FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: user_edges _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.user_edges FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: user_emails _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.user_emails FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: user_entries _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.user_entries FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: users _100_timestamps; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _100_timestamps BEFORE INSERT OR UPDATE ON app_public.users FOR EACH ROW EXECUTE FUNCTION app_private.tg__timestamps();


--
-- Name: user_emails _200_forbid_existing_email; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _200_forbid_existing_email BEFORE INSERT ON app_public.user_emails FOR EACH ROW EXECUTE FUNCTION app_public.tg_user_emails__forbid_if_verified();


--
-- Name: exam_results _200_poi_exam_results_create_or_update_poi; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _200_poi_exam_results_create_or_update_poi BEFORE INSERT OR UPDATE ON app_public.exam_results FOR EACH ROW EXECUTE FUNCTION app_public.tg__poi_related__create_or_replace_poi();


--
-- Name: poi_favorites _200_poi_favorites_create_poi; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _200_poi_favorites_create_poi BEFORE INSERT ON app_public.poi_favorites FOR EACH ROW EXECUTE FUNCTION app_public.tg__poi_related__create_or_replace_poi();


--
-- Name: poi_reviews _200_poi_reviews_create_poi; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _200_poi_reviews_create_poi BEFORE INSERT ON app_public.poi_reviews FOR EACH ROW EXECUTE FUNCTION app_public.tg__poi_related__create_or_replace_poi();


--
-- Name: user_edges _200_unfriend; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _200_unfriend AFTER DELETE ON app_public.user_edges FOR EACH ROW EXECUTE FUNCTION app_public.tg_user_edges__unfriend();


--
-- Name: private_daily_records _200_update_shared_daily_records; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _200_update_shared_daily_records AFTER INSERT OR UPDATE ON app_public.private_daily_records FOR EACH ROW EXECUTE FUNCTION app_public.tg_update_shared_daily_records();


--
-- Name: poi_reviews _300_poi_reviews_check_kakao_id; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _300_poi_reviews_check_kakao_id BEFORE UPDATE ON app_public.poi_reviews FOR EACH ROW EXECUTE FUNCTION app_public.tg__poi_reviews__check_kakao_id();


--
-- Name: shared_daily_records _300_pupcle_on_complete_daily_record; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _300_pupcle_on_complete_daily_record AFTER INSERT OR UPDATE ON app_public.shared_daily_records FOR EACH ROW EXECUTE FUNCTION app_public.tg_pupcle_on_complete_daily_record();


--
-- Name: poi_reviews _400_poi_reviews_after_change; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _400_poi_reviews_after_change AFTER INSERT OR DELETE OR UPDATE ON app_public.poi_reviews FOR EACH ROW EXECUTE FUNCTION app_public.tg__poi_reviews__update_poi_on_review();


--
-- Name: user_emails _500_audit_added; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_audit_added AFTER INSERT ON app_public.user_emails FOR EACH ROW EXECUTE FUNCTION app_private.tg__add_audit_job('added_email', 'user_id', 'id', 'email');


--
-- Name: user_authentications _500_audit_removed; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_audit_removed AFTER DELETE ON app_public.user_authentications FOR EACH ROW EXECUTE FUNCTION app_private.tg__add_audit_job('unlinked_account', 'user_id', 'service', 'identifier');


--
-- Name: user_emails _500_audit_removed; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_audit_removed AFTER DELETE ON app_public.user_emails FOR EACH ROW EXECUTE FUNCTION app_private.tg__add_audit_job('removed_email', 'user_id', 'id', 'email');


--
-- Name: users _500_deletion_organization_checks_and_actions; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_deletion_organization_checks_and_actions BEFORE DELETE ON app_public.users FOR EACH ROW WHEN ((app_public.current_user_id() IS NOT NULL)) EXECUTE FUNCTION app_public.tg_users__deletion_organization_checks_and_actions();


--
-- Name: users _500_gql_update; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_gql_update AFTER UPDATE ON app_public.users FOR EACH ROW EXECUTE FUNCTION app_public.tg__graphql_subscription('userChanged', 'graphql:user:$1', 'id');


--
-- Name: user_emails _500_insert_secrets; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_insert_secrets AFTER INSERT ON app_public.user_emails FOR EACH ROW EXECUTE FUNCTION app_private.tg_user_email_secrets__insert_with_user_email();


--
-- Name: users _500_insert_secrets; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_insert_secrets AFTER INSERT ON app_public.users FOR EACH ROW EXECUTE FUNCTION app_private.tg_user_secrets__insert_with_user();


--
-- Name: user_emails _500_prevent_delete_last; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_prevent_delete_last AFTER DELETE ON app_public.user_emails REFERENCING OLD TABLE AS deleted FOR EACH STATEMENT EXECUTE FUNCTION app_public.tg_user_emails__prevent_delete_last_email();


--
-- Name: organization_invitations _500_send_email; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_send_email AFTER INSERT ON app_public.organization_invitations FOR EACH ROW EXECUTE FUNCTION app_private.tg__add_job('organization_invitations__send_invite');


--
-- Name: user_emails _500_verify_account_on_verified; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _500_verify_account_on_verified AFTER INSERT OR UPDATE OF is_verified ON app_public.user_emails FOR EACH ROW WHEN ((new.is_verified IS TRUE)) EXECUTE FUNCTION app_public.tg_user_emails__verify_account_on_verified();


--
-- Name: users _550_insert_entries; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _550_insert_entries AFTER INSERT ON app_public.users FOR EACH ROW EXECUTE FUNCTION app_public.tg_user_entries__insert_with_user();


--
-- Name: users _570_insert_exam_categories; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _570_insert_exam_categories AFTER INSERT ON app_public.users FOR EACH ROW EXECUTE FUNCTION app_public.tg_exam_categories__insert_with_user();


--
-- Name: user_emails _900_send_verification_email; Type: TRIGGER; Schema: app_public; Owner: -
--

CREATE TRIGGER _900_send_verification_email AFTER INSERT ON app_public.user_emails FOR EACH ROW WHEN ((new.is_verified IS FALSE)) EXECUTE FUNCTION app_private.tg__add_job('user_emails__send_verification');


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: user_authentication_secrets user_authentication_secrets_user_authentication_id_fkey; Type: FK CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.user_authentication_secrets
    ADD CONSTRAINT user_authentication_secrets_user_authentication_id_fkey FOREIGN KEY (user_authentication_id) REFERENCES app_public.user_authentications(id) ON DELETE CASCADE;


--
-- Name: user_email_secrets user_email_secrets_user_email_id_fkey; Type: FK CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.user_email_secrets
    ADD CONSTRAINT user_email_secrets_user_email_id_fkey FOREIGN KEY (user_email_id) REFERENCES app_public.user_emails(id) ON DELETE CASCADE;


--
-- Name: user_secrets user_secrets_user_id_fkey; Type: FK CONSTRAINT; Schema: app_private; Owner: -
--

ALTER TABLE ONLY app_private.user_secrets
    ADD CONSTRAINT user_secrets_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: exam_categories exam_categories_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_categories
    ADD CONSTRAINT exam_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: exam_result_assets exam_result_assets_exam_result_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_result_assets
    ADD CONSTRAINT exam_result_assets_exam_result_id_fkey FOREIGN KEY (exam_result_id) REFERENCES app_public.exam_results(id) ON DELETE CASCADE;


--
-- Name: exam_result_assets exam_result_assets_kind_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_result_assets
    ADD CONSTRAINT exam_result_assets_kind_fkey FOREIGN KEY (kind) REFERENCES app_public.user_asset_kind(kind);


--
-- Name: exam_result_assets exam_result_assets_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_result_assets
    ADD CONSTRAINT exam_result_assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: exam_results exam_results_exam_category_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_results
    ADD CONSTRAINT exam_results_exam_category_id_fkey FOREIGN KEY (exam_category_id) REFERENCES app_public.exam_categories(id) ON DELETE RESTRICT;


--
-- Name: exam_results exam_results_pet_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_results
    ADD CONSTRAINT exam_results_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES app_public.pets(id) ON DELETE CASCADE;


--
-- Name: exam_results exam_results_poi_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_results
    ADD CONSTRAINT exam_results_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES app_public.poi(id) ON DELETE RESTRICT;


--
-- Name: exam_results exam_results_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.exam_results
    ADD CONSTRAINT exam_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_from_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.friend_requests
    ADD CONSTRAINT friend_requests_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_to_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.friend_requests
    ADD CONSTRAINT friend_requests_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: organization_invitations organization_invitations_organization_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organization_invitations
    ADD CONSTRAINT organization_invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES app_public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_invitations organization_invitations_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organization_invitations
    ADD CONSTRAINT organization_invitations_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_organization_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organization_memberships
    ADD CONSTRAINT organization_memberships_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES app_public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.organization_memberships
    ADD CONSTRAINT organization_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: pets pets_gender_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.pets
    ADD CONSTRAINT pets_gender_fkey FOREIGN KEY (gender) REFERENCES app_public.pet_gender(gender);


--
-- Name: pets pets_kind_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.pets
    ADD CONSTRAINT pets_kind_fkey FOREIGN KEY (kind) REFERENCES app_public.pet_kind(kind);


--
-- Name: pets pets_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.pets
    ADD CONSTRAINT pets_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: poi_favorites poi_favorites_poi_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.poi_favorites
    ADD CONSTRAINT poi_favorites_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES app_public.poi(id) ON DELETE CASCADE;


--
-- Name: poi_favorites poi_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.poi_favorites
    ADD CONSTRAINT poi_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: poi_reviews poi_reviews_poi_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.poi_reviews
    ADD CONSTRAINT poi_reviews_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES app_public.poi(id) ON DELETE CASCADE;


--
-- Name: poi_reviews poi_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.poi_reviews
    ADD CONSTRAINT poi_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: private_daily_records private_daily_records_bathroom_status_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.private_daily_records
    ADD CONSTRAINT private_daily_records_bathroom_status_fkey FOREIGN KEY (bathroom_status) REFERENCES app_public.daily_record_status(status);


--
-- Name: private_daily_records private_daily_records_diet_status_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.private_daily_records
    ADD CONSTRAINT private_daily_records_diet_status_fkey FOREIGN KEY (diet_status) REFERENCES app_public.daily_record_status(status);


--
-- Name: private_daily_records private_daily_records_health_status_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.private_daily_records
    ADD CONSTRAINT private_daily_records_health_status_fkey FOREIGN KEY (health_status) REFERENCES app_public.daily_record_status(status);


--
-- Name: private_daily_records private_daily_records_pet_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.private_daily_records
    ADD CONSTRAINT private_daily_records_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES app_public.pets(id) ON DELETE CASCADE;


--
-- Name: private_daily_records private_daily_records_play_status_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.private_daily_records
    ADD CONSTRAINT private_daily_records_play_status_fkey FOREIGN KEY (play_status) REFERENCES app_public.daily_record_status(status);


--
-- Name: private_daily_records private_daily_records_sleep_status_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.private_daily_records
    ADD CONSTRAINT private_daily_records_sleep_status_fkey FOREIGN KEY (sleep_status) REFERENCES app_public.daily_record_status(status);


--
-- Name: private_daily_records private_daily_records_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.private_daily_records
    ADD CONSTRAINT private_daily_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: private_daily_records private_daily_records_walking_status_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.private_daily_records
    ADD CONSTRAINT private_daily_records_walking_status_fkey FOREIGN KEY (walking_status) REFERENCES app_public.daily_record_status(status);


--
-- Name: shared_daily_records shared_daily_records_day_status_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.shared_daily_records
    ADD CONSTRAINT shared_daily_records_day_status_fkey FOREIGN KEY (day_status) REFERENCES app_public.daily_record_day_status(status);


--
-- Name: shared_daily_records shared_daily_records_pet_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.shared_daily_records
    ADD CONSTRAINT shared_daily_records_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES app_public.pets(id) ON DELETE CASCADE;


--
-- Name: shared_daily_records shared_daily_records_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.shared_daily_records
    ADD CONSTRAINT shared_daily_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: user_authentications user_authentications_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_authentications
    ADD CONSTRAINT user_authentications_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: user_edges user_edges_daily_records_shared_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_edges
    ADD CONSTRAINT user_edges_daily_records_shared_fkey FOREIGN KEY (daily_records_shared) REFERENCES app_public.share_level(level);


--
-- Name: user_edges user_edges_from_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_edges
    ADD CONSTRAINT user_edges_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: user_edges user_edges_to_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_edges
    ADD CONSTRAINT user_edges_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: user_emails user_emails_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_emails
    ADD CONSTRAINT user_emails_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: user_entries user_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: app_public; Owner: -
--

ALTER TABLE ONLY app_public.user_entries
    ADD CONSTRAINT user_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_public.users(id) ON DELETE CASCADE;


--
-- Name: connect_pg_simple_sessions; Type: ROW SECURITY; Schema: app_private; Owner: -
--

ALTER TABLE app_private.connect_pg_simple_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: app_private; Owner: -
--

ALTER TABLE app_private.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_authentication_secrets; Type: ROW SECURITY; Schema: app_private; Owner: -
--

ALTER TABLE app_private.user_authentication_secrets ENABLE ROW LEVEL SECURITY;

--
-- Name: user_email_secrets; Type: ROW SECURITY; Schema: app_private; Owner: -
--

ALTER TABLE app_private.user_email_secrets ENABLE ROW LEVEL SECURITY;

--
-- Name: user_secrets; Type: ROW SECURITY; Schema: app_private; Owner: -
--

ALTER TABLE app_private.user_secrets ENABLE ROW LEVEL SECURITY;

--
-- Name: friend_requests delete_from_me; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_from_me ON app_public.friend_requests FOR DELETE USING ((from_user_id = app_public.current_user_id()));


--
-- Name: exam_categories delete_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_own ON app_public.exam_categories FOR DELETE USING (((user_id = app_public.current_user_id()) AND (is_default_category IS NOT TRUE)));


--
-- Name: exam_result_assets delete_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_own ON app_public.exam_result_assets FOR DELETE USING ((user_id = app_public.current_user_id()));


--
-- Name: exam_results delete_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_own ON app_public.exam_results FOR DELETE USING ((user_id = app_public.current_user_id()));


--
-- Name: poi_favorites delete_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_own ON app_public.poi_favorites FOR DELETE USING ((user_id = app_public.current_user_id()));


--
-- Name: poi_reviews delete_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_own ON app_public.poi_reviews FOR DELETE USING ((user_id = app_public.current_user_id()));


--
-- Name: user_authentications delete_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_own ON app_public.user_authentications FOR DELETE USING ((user_id = app_public.current_user_id()));


--
-- Name: user_edges delete_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_own ON app_public.user_edges FOR DELETE USING ((from_user_id = app_public.current_user_id()));


--
-- Name: user_emails delete_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_own ON app_public.user_emails FOR DELETE USING ((user_id = app_public.current_user_id()));


--
-- Name: friend_requests delete_to_me; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY delete_to_me ON app_public.friend_requests FOR DELETE USING ((to_user_id = app_public.current_user_id()));


--
-- Name: exam_categories; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.exam_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_result_assets; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.exam_result_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_results; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.exam_results ENABLE ROW LEVEL SECURITY;

--
-- Name: friend_requests; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.friend_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: friend_requests insert_from_me; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_from_me ON app_public.friend_requests FOR INSERT WITH CHECK ((from_user_id = app_public.current_user_id()));


--
-- Name: exam_categories insert_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_own ON app_public.exam_categories FOR INSERT WITH CHECK (((user_id = app_public.current_user_id()) AND (is_default_category IS NOT TRUE)));


--
-- Name: exam_result_assets insert_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_own ON app_public.exam_result_assets FOR INSERT WITH CHECK ((user_id = app_public.current_user_id()));


--
-- Name: exam_results insert_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_own ON app_public.exam_results FOR INSERT WITH CHECK ((user_id = app_public.current_user_id()));


--
-- Name: pets insert_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_own ON app_public.pets FOR INSERT WITH CHECK ((user_id = app_public.current_user_id()));


--
-- Name: poi_favorites insert_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_own ON app_public.poi_favorites FOR INSERT WITH CHECK ((user_id = app_public.current_user_id()));


--
-- Name: poi_reviews insert_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_own ON app_public.poi_reviews FOR INSERT WITH CHECK ((user_id = app_public.current_user_id()));


--
-- Name: private_daily_records insert_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_own ON app_public.private_daily_records FOR INSERT WITH CHECK (((user_id = app_public.current_user_id()) AND (day >= (now() - '3 days'::interval))));


--
-- Name: shared_daily_records insert_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_own ON app_public.shared_daily_records FOR INSERT WITH CHECK (((user_id = app_public.current_user_id()) AND (day >= (now() - '3 days'::interval))));


--
-- Name: user_emails insert_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY insert_own ON app_public.user_emails FOR INSERT WITH CHECK ((user_id = app_public.current_user_id()));


--
-- Name: organization_invitations; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.organization_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_memberships; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.organization_memberships ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: pets; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.pets ENABLE ROW LEVEL SECURITY;

--
-- Name: poi; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.poi ENABLE ROW LEVEL SECURITY;

--
-- Name: poi_favorites; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.poi_favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: poi_reviews; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.poi_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: private_daily_records; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.private_daily_records ENABLE ROW LEVEL SECURITY;

--
-- Name: poi select_all; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_all ON app_public.poi FOR SELECT USING (true);


--
-- Name: poi_favorites select_all; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_all ON app_public.poi_favorites FOR SELECT USING (true);


--
-- Name: poi_reviews select_all; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_all ON app_public.poi_reviews FOR SELECT USING (true);


--
-- Name: users select_all; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_all ON app_public.users FOR SELECT USING (true);


--
-- Name: friend_requests select_from_me; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_from_me ON app_public.friend_requests FOR SELECT USING ((from_user_id = app_public.current_user_id()));


--
-- Name: organization_memberships select_invited; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_invited ON app_public.organization_memberships FOR SELECT USING ((organization_id IN ( SELECT app_public.current_user_invited_organization_ids() AS current_user_invited_organization_ids)));


--
-- Name: organizations select_invited; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_invited ON app_public.organizations FOR SELECT USING ((id IN ( SELECT app_public.current_user_invited_organization_ids() AS current_user_invited_organization_ids)));


--
-- Name: organization_memberships select_member; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_member ON app_public.organization_memberships FOR SELECT USING ((organization_id IN ( SELECT app_public.current_user_member_organization_ids() AS current_user_member_organization_ids)));


--
-- Name: organizations select_member; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_member ON app_public.organizations FOR SELECT USING ((id IN ( SELECT app_public.current_user_member_organization_ids() AS current_user_member_organization_ids)));


--
-- Name: exam_categories select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.exam_categories FOR SELECT USING ((user_id = app_public.current_user_id()));


--
-- Name: exam_result_assets select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.exam_result_assets FOR SELECT USING ((user_id = app_public.current_user_id()));


--
-- Name: exam_results select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.exam_results FOR SELECT USING ((user_id = app_public.current_user_id()));


--
-- Name: pets select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.pets FOR SELECT USING ((user_id = app_public.current_user_id()));


--
-- Name: private_daily_records select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.private_daily_records FOR SELECT USING ((user_id = app_public.current_user_id()));


--
-- Name: shared_daily_records select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.shared_daily_records FOR SELECT USING ((user_id = app_public.current_user_id()));


--
-- Name: user_authentications select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.user_authentications FOR SELECT USING ((user_id = app_public.current_user_id()));


--
-- Name: user_edges select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.user_edges FOR SELECT USING ((from_user_id = app_public.current_user_id()));


--
-- Name: user_emails select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.user_emails FOR SELECT USING ((user_id = app_public.current_user_id()));


--
-- Name: user_entries select_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_own ON app_public.user_entries FOR SELECT USING ((user_id = app_public.current_user_id()));


--
-- Name: pets select_shared; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_shared ON app_public.pets FOR SELECT USING ((user_id IN ( SELECT app_public.current_user_shared_friend_ids() AS current_user_shared_friend_ids)));


--
-- Name: shared_daily_records select_shared; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_shared ON app_public.shared_daily_records FOR SELECT USING ((user_id IN ( SELECT app_public.current_user_shared_friend_ids() AS current_user_shared_friend_ids)));


--
-- Name: friend_requests select_to_me; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY select_to_me ON app_public.friend_requests FOR SELECT USING ((to_user_id = app_public.current_user_id()));


--
-- Name: shared_daily_records; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.shared_daily_records ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_categories update_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_own ON app_public.exam_categories FOR UPDATE USING (((user_id = app_public.current_user_id()) AND (is_default_category IS NOT TRUE)));


--
-- Name: exam_result_assets update_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_own ON app_public.exam_result_assets FOR UPDATE USING ((user_id = app_public.current_user_id()));


--
-- Name: exam_results update_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_own ON app_public.exam_results FOR UPDATE USING ((user_id = app_public.current_user_id()));


--
-- Name: pets update_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_own ON app_public.pets FOR UPDATE USING ((user_id = app_public.current_user_id()));


--
-- Name: poi_favorites update_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_own ON app_public.poi_favorites FOR UPDATE USING ((user_id = app_public.current_user_id()));


--
-- Name: poi_reviews update_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_own ON app_public.poi_reviews FOR UPDATE USING ((user_id = app_public.current_user_id()));


--
-- Name: private_daily_records update_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_own ON app_public.private_daily_records FOR UPDATE USING (((user_id = app_public.current_user_id()) AND (day >= (now() - '3 days'::interval))));


--
-- Name: user_edges update_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_own ON app_public.user_edges FOR UPDATE USING ((from_user_id = app_public.current_user_id()));


--
-- Name: user_entries update_own; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_own ON app_public.user_entries FOR UPDATE USING ((user_id = app_public.current_user_id()));


--
-- Name: organizations update_owner; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_owner ON app_public.organizations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM app_public.organization_memberships
  WHERE ((organization_memberships.organization_id = organizations.id) AND (organization_memberships.user_id = app_public.current_user_id()) AND (organization_memberships.is_owner IS TRUE)))));


--
-- Name: users update_self; Type: POLICY; Schema: app_public; Owner: -
--

CREATE POLICY update_self ON app_public.users FOR UPDATE USING ((id = app_public.current_user_id()));


--
-- Name: user_authentications; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.user_authentications ENABLE ROW LEVEL SECURITY;

--
-- Name: user_edges; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.user_edges ENABLE ROW LEVEL SECURITY;

--
-- Name: user_emails; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.user_emails ENABLE ROW LEVEL SECURITY;

--
-- Name: user_entries; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.user_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: app_public; Owner: -
--

ALTER TABLE app_public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA app_hidden; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA app_hidden TO pupcle_visitor;


--
-- Name: SCHEMA app_public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA app_public TO pupcle_visitor;
GRANT USAGE ON SCHEMA app_public TO pupcle_authenticator;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO pupcle_visitor;


--
-- Name: FUNCTION assert_valid_password(new_password text); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.assert_valid_password(new_password text) FROM PUBLIC;


--
-- Name: TABLE users; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.users TO pupcle_visitor;


--
-- Name: COLUMN users.username; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(username) ON TABLE app_public.users TO pupcle_visitor;


--
-- Name: COLUMN users.nickname; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(nickname) ON TABLE app_public.users TO pupcle_visitor;


--
-- Name: COLUMN users.avatar_url; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(avatar_url) ON TABLE app_public.users TO pupcle_visitor;


--
-- Name: FUNCTION link_or_register_user(f_user_id uuid, f_service character varying, f_identifier character varying, f_profile json, f_auth_details json); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.link_or_register_user(f_user_id uuid, f_service character varying, f_identifier character varying, f_profile json, f_auth_details json) FROM PUBLIC;


--
-- Name: FUNCTION login(username public.citext, password text); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.login(username public.citext, password text) FROM PUBLIC;


--
-- Name: FUNCTION really_create_user(username public.citext, email text, email_is_verified boolean, nickname text, avatar_url text, password text); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.really_create_user(username public.citext, email text, email_is_verified boolean, nickname text, avatar_url text, password text) FROM PUBLIC;


--
-- Name: FUNCTION register_user(f_service character varying, f_identifier character varying, f_profile json, f_auth_details json, f_email_is_verified boolean); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.register_user(f_service character varying, f_identifier character varying, f_profile json, f_auth_details json, f_email_is_verified boolean) FROM PUBLIC;


--
-- Name: FUNCTION reset_password(user_id uuid, reset_token text, new_password text); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.reset_password(user_id uuid, reset_token text, new_password text) FROM PUBLIC;


--
-- Name: FUNCTION tg__add_audit_job(); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.tg__add_audit_job() FROM PUBLIC;


--
-- Name: FUNCTION tg__add_job(); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.tg__add_job() FROM PUBLIC;


--
-- Name: FUNCTION tg__timestamps(); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.tg__timestamps() FROM PUBLIC;


--
-- Name: FUNCTION tg_user_email_secrets__insert_with_user_email(); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.tg_user_email_secrets__insert_with_user_email() FROM PUBLIC;


--
-- Name: FUNCTION tg_user_secrets__insert_with_user(); Type: ACL; Schema: app_private; Owner: -
--

REVOKE ALL ON FUNCTION app_private.tg_user_secrets__insert_with_user() FROM PUBLIC;


--
-- Name: FUNCTION accept_invitation_to_organization(invitation_id uuid, code text); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.accept_invitation_to_organization(invitation_id uuid, code text) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.accept_invitation_to_organization(invitation_id uuid, code text) TO pupcle_visitor;


--
-- Name: FUNCTION change_password(old_password text, new_password text); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.change_password(old_password text, new_password text) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.change_password(old_password text, new_password text) TO pupcle_visitor;


--
-- Name: FUNCTION confirm_account_deletion(token text); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.confirm_account_deletion(token text) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.confirm_account_deletion(token text) TO pupcle_visitor;


--
-- Name: TABLE organizations; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.organizations TO pupcle_visitor;


--
-- Name: COLUMN organizations.slug; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(slug) ON TABLE app_public.organizations TO pupcle_visitor;


--
-- Name: COLUMN organizations.name; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(name) ON TABLE app_public.organizations TO pupcle_visitor;


--
-- Name: FUNCTION create_organization(slug public.citext, name text); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.create_organization(slug public.citext, name text) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.create_organization(slug public.citext, name text) TO pupcle_visitor;


--
-- Name: FUNCTION current_session_id(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.current_session_id() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.current_session_id() TO pupcle_visitor;


--
-- Name: FUNCTION "current_user"(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public."current_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public."current_user"() TO pupcle_visitor;


--
-- Name: FUNCTION current_user_id(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.current_user_id() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.current_user_id() TO pupcle_visitor;


--
-- Name: FUNCTION current_user_invited_organization_ids(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.current_user_invited_organization_ids() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.current_user_invited_organization_ids() TO pupcle_visitor;


--
-- Name: FUNCTION current_user_member_organization_ids(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.current_user_member_organization_ids() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.current_user_member_organization_ids() TO pupcle_visitor;


--
-- Name: FUNCTION current_user_shared_friend_ids(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.current_user_shared_friend_ids() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.current_user_shared_friend_ids() TO pupcle_visitor;


--
-- Name: FUNCTION delete_organization(organization_id uuid); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.delete_organization(organization_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.delete_organization(organization_id uuid) TO pupcle_visitor;


--
-- Name: FUNCTION forgot_password(email public.citext); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.forgot_password(email public.citext) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.forgot_password(email public.citext) TO pupcle_visitor;


--
-- Name: FUNCTION invite_to_organization(organization_id uuid, username public.citext, email public.citext); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.invite_to_organization(organization_id uuid, username public.citext, email public.citext) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.invite_to_organization(organization_id uuid, username public.citext, email public.citext) TO pupcle_visitor;


--
-- Name: FUNCTION logout(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.logout() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.logout() TO pupcle_visitor;


--
-- Name: TABLE user_emails; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.user_emails TO pupcle_visitor;


--
-- Name: COLUMN user_emails.email; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(email) ON TABLE app_public.user_emails TO pupcle_visitor;


--
-- Name: FUNCTION make_email_primary(email_id uuid); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.make_email_primary(email_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.make_email_primary(email_id uuid) TO pupcle_visitor;


--
-- Name: FUNCTION organization_for_invitation(invitation_id uuid, code text); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.organization_for_invitation(invitation_id uuid, code text) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.organization_for_invitation(invitation_id uuid, code text) TO pupcle_visitor;


--
-- Name: FUNCTION organizations_current_user_is_billing_contact(org app_public.organizations); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.organizations_current_user_is_billing_contact(org app_public.organizations) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.organizations_current_user_is_billing_contact(org app_public.organizations) TO pupcle_visitor;


--
-- Name: FUNCTION organizations_current_user_is_owner(org app_public.organizations); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.organizations_current_user_is_owner(org app_public.organizations) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.organizations_current_user_is_owner(org app_public.organizations) TO pupcle_visitor;


--
-- Name: FUNCTION remove_from_organization(organization_id uuid, user_id uuid); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.remove_from_organization(organization_id uuid, user_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.remove_from_organization(organization_id uuid, user_id uuid) TO pupcle_visitor;


--
-- Name: FUNCTION request_account_deletion(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.request_account_deletion() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.request_account_deletion() TO pupcle_visitor;


--
-- Name: FUNCTION resend_email_verification_code(email_id uuid); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.resend_email_verification_code(email_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.resend_email_verification_code(email_id uuid) TO pupcle_visitor;


--
-- Name: FUNCTION tg__graphql_subscription(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg__graphql_subscription() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg__graphql_subscription() TO pupcle_visitor;


--
-- Name: FUNCTION tg__poi_related__create_or_replace_poi(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg__poi_related__create_or_replace_poi() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg__poi_related__create_or_replace_poi() TO pupcle_visitor;


--
-- Name: FUNCTION tg__poi_reviews__check_kakao_id(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg__poi_reviews__check_kakao_id() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg__poi_reviews__check_kakao_id() TO pupcle_visitor;


--
-- Name: FUNCTION tg__poi_reviews__update_poi_on_review(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg__poi_reviews__update_poi_on_review() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg__poi_reviews__update_poi_on_review() TO pupcle_visitor;


--
-- Name: FUNCTION tg_exam_categories__insert_with_user(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg_exam_categories__insert_with_user() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg_exam_categories__insert_with_user() TO pupcle_visitor;


--
-- Name: FUNCTION tg_pupcle_on_complete_daily_record(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg_pupcle_on_complete_daily_record() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg_pupcle_on_complete_daily_record() TO pupcle_visitor;


--
-- Name: FUNCTION tg_update_shared_daily_records(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg_update_shared_daily_records() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg_update_shared_daily_records() TO pupcle_visitor;


--
-- Name: FUNCTION tg_user_edges__unfriend(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg_user_edges__unfriend() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg_user_edges__unfriend() TO pupcle_visitor;


--
-- Name: FUNCTION tg_user_emails__forbid_if_verified(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg_user_emails__forbid_if_verified() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg_user_emails__forbid_if_verified() TO pupcle_visitor;


--
-- Name: FUNCTION tg_user_emails__prevent_delete_last_email(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg_user_emails__prevent_delete_last_email() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg_user_emails__prevent_delete_last_email() TO pupcle_visitor;


--
-- Name: FUNCTION tg_user_emails__verify_account_on_verified(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg_user_emails__verify_account_on_verified() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg_user_emails__verify_account_on_verified() TO pupcle_visitor;


--
-- Name: FUNCTION tg_user_entries__insert_with_user(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg_user_entries__insert_with_user() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg_user_entries__insert_with_user() TO pupcle_visitor;


--
-- Name: FUNCTION tg_users__deletion_organization_checks_and_actions(); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.tg_users__deletion_organization_checks_and_actions() FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.tg_users__deletion_organization_checks_and_actions() TO pupcle_visitor;


--
-- Name: FUNCTION transfer_organization_billing_contact(organization_id uuid, user_id uuid); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.transfer_organization_billing_contact(organization_id uuid, user_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.transfer_organization_billing_contact(organization_id uuid, user_id uuid) TO pupcle_visitor;


--
-- Name: FUNCTION transfer_organization_ownership(organization_id uuid, user_id uuid); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.transfer_organization_ownership(organization_id uuid, user_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.transfer_organization_ownership(organization_id uuid, user_id uuid) TO pupcle_visitor;


--
-- Name: FUNCTION users_has_password(u app_public.users); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.users_has_password(u app_public.users) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.users_has_password(u app_public.users) TO pupcle_visitor;


--
-- Name: FUNCTION verify_email(user_email_id uuid, token text); Type: ACL; Schema: app_public; Owner: -
--

REVOKE ALL ON FUNCTION app_public.verify_email(user_email_id uuid, token text) FROM PUBLIC;
GRANT ALL ON FUNCTION app_public.verify_email(user_email_id uuid, token text) TO pupcle_visitor;


--
-- Name: TABLE daily_record_day_status; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.daily_record_day_status TO pupcle_authenticator;


--
-- Name: TABLE daily_record_status; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.daily_record_status TO pupcle_authenticator;


--
-- Name: TABLE exam_categories; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.exam_categories TO pupcle_visitor;


--
-- Name: COLUMN exam_categories.id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(id),UPDATE(id) ON TABLE app_public.exam_categories TO pupcle_visitor;


--
-- Name: COLUMN exam_categories.user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(user_id),UPDATE(user_id) ON TABLE app_public.exam_categories TO pupcle_visitor;


--
-- Name: COLUMN exam_categories.name; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(name),UPDATE(name) ON TABLE app_public.exam_categories TO pupcle_visitor;


--
-- Name: COLUMN exam_categories.has_data; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(has_data),UPDATE(has_data) ON TABLE app_public.exam_categories TO pupcle_visitor;


--
-- Name: COLUMN exam_categories.default_point_buckets; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(default_point_buckets),UPDATE(default_point_buckets) ON TABLE app_public.exam_categories TO pupcle_visitor;


--
-- Name: TABLE exam_result_assets; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.exam_result_assets TO pupcle_visitor;


--
-- Name: COLUMN exam_result_assets.id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(id) ON TABLE app_public.exam_result_assets TO pupcle_visitor;


--
-- Name: COLUMN exam_result_assets.user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(user_id),UPDATE(user_id) ON TABLE app_public.exam_result_assets TO pupcle_visitor;


--
-- Name: COLUMN exam_result_assets.exam_result_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(exam_result_id),UPDATE(exam_result_id) ON TABLE app_public.exam_result_assets TO pupcle_visitor;


--
-- Name: COLUMN exam_result_assets.kind; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(kind),UPDATE(kind) ON TABLE app_public.exam_result_assets TO pupcle_visitor;


--
-- Name: COLUMN exam_result_assets.asset_url; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(asset_url),UPDATE(asset_url) ON TABLE app_public.exam_result_assets TO pupcle_visitor;


--
-- Name: COLUMN exam_result_assets.metadata; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(metadata),UPDATE(metadata) ON TABLE app_public.exam_result_assets TO pupcle_visitor;


--
-- Name: TABLE exam_results; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(id) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(user_id),UPDATE(user_id) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.pet_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(pet_id),UPDATE(pet_id) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.exam_category_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(exam_category_id),UPDATE(exam_category_id) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.taken_at; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(taken_at),UPDATE(taken_at) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.cost; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(cost),UPDATE(cost) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.poi_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(poi_id),UPDATE(poi_id) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.kakao_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(kakao_id),UPDATE(kakao_id) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.next_reservation; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(next_reservation),UPDATE(next_reservation) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.memo; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(memo),UPDATE(memo) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: COLUMN exam_results.exam_data; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(exam_data),UPDATE(exam_data) ON TABLE app_public.exam_results TO pupcle_visitor;


--
-- Name: TABLE friend_requests; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.friend_requests TO pupcle_visitor;


--
-- Name: COLUMN friend_requests.from_user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(from_user_id) ON TABLE app_public.friend_requests TO pupcle_visitor;


--
-- Name: COLUMN friend_requests.to_user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(to_user_id) ON TABLE app_public.friend_requests TO pupcle_visitor;


--
-- Name: TABLE organization_memberships; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.organization_memberships TO pupcle_visitor;


--
-- Name: TABLE pet_gender; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.pet_gender TO pupcle_authenticator;


--
-- Name: TABLE pet_kind; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.pet_kind TO pupcle_authenticator;


--
-- Name: TABLE pets; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(user_id) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.kind; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(kind) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.name; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(name),UPDATE(name) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.gender; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(gender),UPDATE(gender) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.dob; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(dob),UPDATE(dob) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.weight; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(weight),UPDATE(weight) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.neutered; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(neutered),UPDATE(neutered) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.avatar_url; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(avatar_url),UPDATE(avatar_url) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.vaccinations; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(vaccinations),UPDATE(vaccinations) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: COLUMN pets.injections; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(injections),UPDATE(injections) ON TABLE app_public.pets TO pupcle_visitor;


--
-- Name: TABLE poi; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.poi TO pupcle_visitor;


--
-- Name: TABLE poi_favorites; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.poi_favorites TO pupcle_visitor;


--
-- Name: COLUMN poi_favorites.user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(user_id),UPDATE(user_id) ON TABLE app_public.poi_favorites TO pupcle_visitor;


--
-- Name: COLUMN poi_favorites.poi_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(poi_id),UPDATE(poi_id) ON TABLE app_public.poi_favorites TO pupcle_visitor;


--
-- Name: COLUMN poi_favorites.kakao_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(kakao_id),UPDATE(kakao_id) ON TABLE app_public.poi_favorites TO pupcle_visitor;


--
-- Name: TABLE poi_reviews; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.poi_reviews TO pupcle_visitor;


--
-- Name: COLUMN poi_reviews.poi_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(poi_id),UPDATE(poi_id) ON TABLE app_public.poi_reviews TO pupcle_visitor;


--
-- Name: COLUMN poi_reviews.user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(user_id),UPDATE(user_id) ON TABLE app_public.poi_reviews TO pupcle_visitor;


--
-- Name: COLUMN poi_reviews.kakao_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(kakao_id),UPDATE(kakao_id) ON TABLE app_public.poi_reviews TO pupcle_visitor;


--
-- Name: COLUMN poi_reviews.comment; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(comment),UPDATE(comment) ON TABLE app_public.poi_reviews TO pupcle_visitor;


--
-- Name: COLUMN poi_reviews.rating; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(rating),UPDATE(rating) ON TABLE app_public.poi_reviews TO pupcle_visitor;


--
-- Name: TABLE private_daily_records; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(user_id) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.pet_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(pet_id) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.day; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(day) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.sleep_status; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(sleep_status),UPDATE(sleep_status) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.sleep_comment; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(sleep_comment),UPDATE(sleep_comment) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.diet_status; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(diet_status),UPDATE(diet_status) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.diet_comment; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(diet_comment),UPDATE(diet_comment) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.walking_status; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(walking_status),UPDATE(walking_status) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.walking_comment; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(walking_comment),UPDATE(walking_comment) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.play_status; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(play_status),UPDATE(play_status) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.play_comment; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(play_comment),UPDATE(play_comment) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.bathroom_status; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(bathroom_status),UPDATE(bathroom_status) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.bathroom_comment; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(bathroom_comment),UPDATE(bathroom_comment) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.health_status; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(health_status),UPDATE(health_status) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: COLUMN private_daily_records.health_comment; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(health_comment),UPDATE(health_comment) ON TABLE app_public.private_daily_records TO pupcle_visitor;


--
-- Name: TABLE share_level; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.share_level TO pupcle_authenticator;


--
-- Name: TABLE shared_daily_records; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.shared_daily_records TO pupcle_visitor;


--
-- Name: COLUMN shared_daily_records.user_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(user_id) ON TABLE app_public.shared_daily_records TO pupcle_visitor;


--
-- Name: COLUMN shared_daily_records.pet_id; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(pet_id) ON TABLE app_public.shared_daily_records TO pupcle_visitor;


--
-- Name: COLUMN shared_daily_records.day; Type: ACL; Schema: app_public; Owner: -
--

GRANT INSERT(day) ON TABLE app_public.shared_daily_records TO pupcle_visitor;


--
-- Name: TABLE user_asset_kind; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.user_asset_kind TO pupcle_authenticator;


--
-- Name: TABLE user_authentications; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.user_authentications TO pupcle_visitor;


--
-- Name: TABLE user_edges; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT,DELETE ON TABLE app_public.user_edges TO pupcle_visitor;


--
-- Name: COLUMN user_edges.daily_records_shared; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(daily_records_shared) ON TABLE app_public.user_edges TO pupcle_visitor;


--
-- Name: TABLE user_entries; Type: ACL; Schema: app_public; Owner: -
--

GRANT SELECT ON TABLE app_public.user_entries TO pupcle_visitor;


--
-- Name: COLUMN user_entries.name; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(name) ON TABLE app_public.user_entries TO pupcle_visitor;


--
-- Name: COLUMN user_entries.address; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(address) ON TABLE app_public.user_entries TO pupcle_visitor;


--
-- Name: COLUMN user_entries.agreed_to_terms; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(agreed_to_terms) ON TABLE app_public.user_entries TO pupcle_visitor;


--
-- Name: COLUMN user_entries.receive_general_notifications; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(receive_general_notifications) ON TABLE app_public.user_entries TO pupcle_visitor;


--
-- Name: COLUMN user_entries.receive_marketing_notifications; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(receive_marketing_notifications) ON TABLE app_public.user_entries TO pupcle_visitor;


--
-- Name: COLUMN user_entries.receive_personal_notifications; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(receive_personal_notifications) ON TABLE app_public.user_entries TO pupcle_visitor;


--
-- Name: COLUMN user_entries.receive_friend_request_notifications; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(receive_friend_request_notifications) ON TABLE app_public.user_entries TO pupcle_visitor;


--
-- Name: COLUMN user_entries.receive_invite_notifications; Type: ACL; Schema: app_public; Owner: -
--

GRANT UPDATE(receive_invite_notifications) ON TABLE app_public.user_entries TO pupcle_visitor;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: app_hidden; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pupcle IN SCHEMA app_hidden GRANT SELECT,USAGE ON SEQUENCES  TO pupcle_visitor;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: app_hidden; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pupcle IN SCHEMA app_hidden GRANT ALL ON FUNCTIONS  TO pupcle_visitor;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: app_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pupcle IN SCHEMA app_public GRANT SELECT,USAGE ON SEQUENCES  TO pupcle_visitor;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: app_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pupcle IN SCHEMA app_public GRANT ALL ON FUNCTIONS  TO pupcle_visitor;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pupcle IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES  TO pupcle_visitor;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pupcle IN SCHEMA public GRANT ALL ON FUNCTIONS  TO pupcle_visitor;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE pupcle REVOKE ALL ON FUNCTIONS  FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

