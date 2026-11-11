-- Counts self-service password resets: at most 3 per user code per hour.
create table if not exists public.password_reset_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_code  text not null,
  created_at timestamptz not null default now(),
  constraint password_reset_attempts_code_len check (char_length(user_code) between 4 and 20)
);

create index if not exists password_reset_attempts_code_time_idx
  on public.password_reset_attempts (user_code, created_at desc);

alter table public.password_reset_attempts enable row level security;
alter table public.password_reset_attempts force row level security;

revoke all on table public.password_reset_attempts from public, anon, authenticated;
grant select, insert, delete on table public.password_reset_attempts to service_role;

notify pgrst, 'reload schema';
