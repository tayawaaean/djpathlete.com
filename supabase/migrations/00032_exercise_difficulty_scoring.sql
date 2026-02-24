ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS difficulty_score integer CHECK (difficulty_score >= 1 AND difficulty_score <= 10),
  ADD COLUMN IF NOT EXISTS prerequisite_exercises uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS progression_order integer;

-- Map existing difficulty enum to numeric scores
UPDATE exercises SET difficulty_score = CASE
  WHEN difficulty = 'beginner' THEN 3
  WHEN difficulty = 'intermediate' THEN 6
  WHEN difficulty = 'advanced' THEN 9
  ELSE 5
END WHERE difficulty_score IS NULL;
