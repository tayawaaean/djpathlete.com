-- Add result tracking columns to performance assessment exercises
-- Allows admin to input measurable results (e.g., jump height, sprint time)
-- =====================================================================

ALTER TABLE performance_assessment_exercises
  ADD COLUMN IF NOT EXISTS result_value NUMERIC,
  ADD COLUMN IF NOT EXISTS result_unit TEXT;

-- Add an index for querying results by exercise name (for progress tracking)
CREATE INDEX IF NOT EXISTS idx_perf_assessment_exercises_exercise_id
  ON performance_assessment_exercises(exercise_id)
  WHERE exercise_id IS NOT NULL;
