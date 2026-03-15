-- Create testimonials table if it doesn't exist yet
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  role text,
  sport text,
  quote text not null,
  avatar_url text,
  rating integer check (rating between 1 and 5),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

-- Policies (use DO block to avoid errors if they already exist)
do $$ begin
  create policy "Anyone can view active testimonials" on public.testimonials for select using (is_active = true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Admins can manage testimonials" on public.testimonials for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );
exception when duplicate_object then null;
end $$;

-- Seed existing testimonials
insert into testimonials (name, role, sport, quote, rating, is_featured, is_active, display_order)
values
  (
    'Abigail Rencheli',
    'WTA Professional Tennis Player',
    'Tennis',
    'What sets him apart is how much he genuinely cares about you as a person first. The Online Program is so easy to navigate and thoroughly explains how to perform the exercises.',
    5,
    true,
    true,
    1
  ),
  (
    'Ganna Poznikhierenko',
    'WTA Professional Tennis Player',
    'Tennis',
    'He''s truly the best coach I''ve ever worked with. The Online Program helps me stay connected even though I am training independently.',
    5,
    true,
    true,
    2
  ),
  (
    'Tina Pisnik',
    'Professional Pickleball Player',
    'Pickleball',
    'Darren understands performance & injury prevention at a very high level. The Online program is seamless and allows me to train from anywhere.',
    5,
    true,
    true,
    3
  ),
  (
    'Stephen Ireland',
    'Former Professional Football Player',
    'Football',
    'His knowledge and attention to my physical and mental wellbeing surpassed my expectations. I hold him in high regard and am forever grateful. He is a top trainer and will forever be a friend.',
    5,
    true,
    true,
    4
  ),
  (
    'Wayde van Niekerk',
    '400m World Record Holder',
    'Athletics',
    'He initiates a unique approach to his work and the training he provides which compliments what I do and it makes me feel right at home as I train towards performance.',
    5,
    true,
    true,
    5
  ),
  (
    'Mohamed',
    'World & Asian ParaAthlete',
    'Para Athletics',
    'He instilled belief and reassurance that I could compete at a high level competition in 4 weeks. I would recommend Darren to anyone who wants to improve their sports performance and lower their incidence of injury.',
    5,
    true,
    true,
    6
  );
