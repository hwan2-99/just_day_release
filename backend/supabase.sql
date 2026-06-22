create table if not exists public.support_comments (
  id uuid primary key default gen_random_uuid(),
  nickname text not null default '익명',
  message text not null,
  created_at timestamptz not null default now(),
  constraint support_comments_nickname_length check (char_length(nickname) <= 20),
  constraint support_comments_message_length check (char_length(message) <= 200)
);

alter table public.support_comments enable row level security;

create policy "Anyone can read support comments"
on public.support_comments
for select
to anon
using (true);
