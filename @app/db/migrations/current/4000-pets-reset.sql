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