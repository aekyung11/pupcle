drop table if exists app_public.user_edges;

drop trigger if exists _550_insert_entries on app_public.users;
drop function if exists app_public.tg_user_entries__insert_with_user();
drop table if exists app_public.user_entries;

revoke usage on schema app_public from :DATABASE_AUTHENTICATOR;
