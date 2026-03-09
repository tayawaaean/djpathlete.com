-- ============================================================================
-- Migration 00046: Exercise Schema Alignment
-- Aligns exercise metadata with the AI program generator's evolving needs:
--   1. Remap legacy category values to current taxonomy
--   2. Replace is_compound boolean with training_intent array
--   3. Add difficulty_max for range-based difficulty
--   4. GIN index on training_intent for AI querying
-- ============================================================================

-- ============================================================================
-- 1. Category data migration
--    category is text[] (converted in 00023) with no CHECK constraint.
--    Remap deprecated values to current taxonomy:
--      cardio         → strength_endurance
--      sport_specific → power
--      recovery       → mobility
-- ============================================================================

UPDATE exercises
  SET category = array_replace(category, 'cardio', 'strength_endurance')
  WHERE 'cardio' = ANY(category);

UPDATE exercises
  SET category = array_replace(category, 'sport_specific', 'power')
  WHERE 'sport_specific' = ANY(category);

UPDATE exercises
  SET category = array_replace(category, 'recovery', 'mobility')
  WHERE 'recovery' = ANY(category);

-- ============================================================================
-- 2. Replace is_compound with training_intent
--    is_compound (boolean, added in 00016) is too coarse for AI selection.
--    training_intent captures how an exercise is used in a program:
--      'build'  — primary strength/hypertrophy work
--      'shape'  — compound/accessory shaping work
--      'prime'  — activation / warm-up primers
--      'cardio' — conditioning / energy system work
-- ============================================================================

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS training_intent text[] NOT NULL DEFAULT '{build}';

-- Backfill: compound exercises → shape, isolation exercises → build
UPDATE exercises
  SET training_intent = CASE
    WHEN is_compound = true  THEN ARRAY['shape']
    WHEN is_compound = false THEN ARRAY['build']
    ELSE ARRAY['build']
  END;

-- Drop the now-redundant is_compound column
ALTER TABLE exercises
  DROP COLUMN IF EXISTS is_compound;

-- ============================================================================
-- 3. Difficulty range support
--    Some exercises span a difficulty band (e.g. push-up: beginner–intermediate).
--    When difficulty_max is set, difficulty is the floor and difficulty_max the
--    ceiling. When NULL the exercise has a single fixed difficulty level.
-- ============================================================================

-- Drop the original CHECK constraint from 00003 if it still exists
ALTER TABLE exercises
  DROP CONSTRAINT IF EXISTS exercises_difficulty_check;

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS difficulty_max text DEFAULT NULL;

-- ============================================================================
-- 4. GIN index on training_intent for AI querying (active exercises only)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exercises_training_intent
  ON exercises USING gin (training_intent)
  WHERE is_active = true;
