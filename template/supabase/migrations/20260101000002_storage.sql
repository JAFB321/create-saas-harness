-- Private storage bucket for app uploads (used by the Supabase Storage provider).
-- All access is server-side (service role + signed URLs), so no storage.objects
-- policies are needed for the anon/authenticated roles.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;
