-- Add tier column to programs (generalize = workout logging only, premium = AI coaching feedback)
alter table programs
  add column tier text not null default 'generalize'
  check (tier in ('generalize', 'premium'));
