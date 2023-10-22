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
