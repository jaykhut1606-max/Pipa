-- Row-level security — spec Part 4.2

alter table public.profiles enable row level security;
alter table public.babies enable row level security;
alter table public.scans enable row level security;
alter table public.events enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Babies: users see/manage babies they own
create policy "Users read own babies" on public.babies
  for select using (auth.uid() = profile_id);

create policy "Users insert own babies" on public.babies
  for insert with check (auth.uid() = profile_id);

create policy "Users update own babies" on public.babies
  for update using (auth.uid() = profile_id);

create policy "Users delete own babies" on public.babies
  for delete using (auth.uid() = profile_id);

-- Scans
create policy "Users read own scans" on public.scans
  for select using (auth.uid() = profile_id);

create policy "Users insert own scans" on public.scans
  for insert with check (auth.uid() = profile_id);

create policy "Users delete own scans" on public.scans
  for delete using (auth.uid() = profile_id);

-- Events
create policy "Users read own events" on public.events
  for select using (auth.uid() = profile_id);

create policy "Users insert own events" on public.events
  for insert with check (auth.uid() = profile_id);

create policy "Users update own events" on public.events
  for update using (auth.uid() = profile_id);

create policy "Users delete own events" on public.events
  for delete using (auth.uid() = profile_id);

-- Chat messages
create policy "Users read own messages" on public.chat_messages
  for select using (auth.uid() = profile_id);

create policy "Users insert own messages" on public.chat_messages
  for insert with check (auth.uid() = profile_id);
