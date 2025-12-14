-- Leaderboard Table Setup for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create the leaderboard table
create table leaderboard (
  id bigint primary key generated always as identity,
  player_name text not null,
  score integer not null,
  wave integer not null,
  created_at timestamp with time zone default now()
);

-- Create an index for faster queries on score
create index leaderboard_score_idx on leaderboard(score desc);

-- Enable Row Level Security
alter table leaderboard enable row level security;

-- Allow anyone to read leaderboard (public read access)
create policy "Allow public read access"
  on leaderboard for select
  to public
  using (true);

-- Allow anyone to insert scores (public write access)
create policy "Allow public insert access"
  on leaderboard for insert
  to public
  with check (true);

-- Optional: Add a policy to prevent updates and deletes
-- This ensures scores cannot be modified after submission
create policy "Prevent updates"
  on leaderboard for update
  to public
  using (false);

create policy "Prevent deletes"
  on leaderboard for delete
  to public
  using (false);
