create table if not exists public.safety_checks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('message', 'screenshot', 'link', 'call', 'payment')),
  score integer not null check (score between 0 and 100),
  level text not null check (level in ('Low risk', 'Medium risk', 'High risk')),
  scam_type text not null,
  preview text not null,
  analysed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists safety_checks_user_date_idx
  on public.safety_checks (user_id, analysed_at desc);

alter table public.safety_checks enable row level security;

drop policy if exists "Users can read their own safety checks" on public.safety_checks;
create policy "Users can read their own safety checks"
  on public.safety_checks for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own safety checks" on public.safety_checks;
create policy "Users can insert their own safety checks"
  on public.safety_checks for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own safety checks" on public.safety_checks;
create policy "Users can update their own safety checks"
  on public.safety_checks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own safety checks" on public.safety_checks;
create policy "Users can delete their own safety checks"
  on public.safety_checks for delete using (auth.uid() = user_id);
