-- Seed featured testimonials from real athletes
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
  );
