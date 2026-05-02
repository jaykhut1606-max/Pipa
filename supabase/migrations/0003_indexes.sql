-- Indexes — spec Part 4.3

create index idx_babies_profile_id on public.babies(profile_id);
create index idx_scans_baby_id_created_at on public.scans(baby_id, created_at desc);
create index idx_scans_profile_id_created_at on public.scans(profile_id, created_at desc);
create index idx_events_baby_id_occurred_at on public.events(baby_id, occurred_at desc);
create index idx_events_profile_id_occurred_at on public.events(profile_id, occurred_at desc);
create index idx_chat_messages_profile_id_created_at on public.chat_messages(profile_id, created_at desc);
create index idx_profiles_stripe_customer_id on public.profiles(stripe_customer_id);
