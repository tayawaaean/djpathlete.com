-- Add suggested_weight_kg to program_exercises for admin weight prescriptions
ALTER TABLE program_exercises
ADD COLUMN IF NOT EXISTS suggested_weight_kg numeric DEFAULT NULL;

-- Add cluster_set to the allowed technique values
-- Drop and re-create the constraint to include the new value
ALTER TABLE program_exercises
DROP CONSTRAINT IF EXISTS program_exercises_technique_check;

ALTER TABLE program_exercises
ADD CONSTRAINT program_exercises_technique_check
CHECK (technique IN ('straight_set', 'superset', 'dropset', 'giant_set', 'circuit', 'rest_pause', 'amrap', 'cluster_set'));
