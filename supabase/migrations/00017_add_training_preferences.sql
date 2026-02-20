-- Add preferred training day names (specific days like Mon/Wed/Fri stored as integers 1-7)
ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS preferred_day_names integer[] DEFAULT '{}';

-- Add time efficiency preference
ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS time_efficiency_preference text DEFAULT NULL;

-- Add preferred training techniques
ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS preferred_techniques text[] DEFAULT '{}';

-- Add technique field to program exercises (straight_set, superset, dropset, etc.)
ALTER TABLE program_exercises
ADD COLUMN IF NOT EXISTS technique text DEFAULT 'straight_set';

-- Add check constraint for valid technique values
ALTER TABLE program_exercises
ADD CONSTRAINT program_exercises_technique_check
CHECK (technique IN ('straight_set', 'superset', 'dropset', 'giant_set', 'circuit', 'rest_pause', 'amrap'));

-- Add check constraint for valid time efficiency preference values
ALTER TABLE client_profiles
ADD CONSTRAINT client_profiles_time_efficiency_check
CHECK (time_efficiency_preference IS NULL OR time_efficiency_preference IN ('supersets_circuits', 'shorter_rest', 'fewer_heavier', 'extend_session'));

-- Add check constraint for preferred_day_names values (1-7)
ALTER TABLE client_profiles
ADD CONSTRAINT client_profiles_day_names_check
CHECK (preferred_day_names <@ ARRAY[1,2,3,4,5,6,7]);
