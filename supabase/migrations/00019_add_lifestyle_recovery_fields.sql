-- Add lifestyle, recovery, and structured preference fields to client_profiles
-- These support the performance-strategist AI prompts

-- New lifestyle & recovery columns
ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS sleep_hours text,
  ADD COLUMN IF NOT EXISTS stress_level text,
  ADD COLUMN IF NOT EXISTS occupation_activity_level text,
  ADD COLUMN IF NOT EXISTS movement_confidence text;

-- Structured preference columns (previously buried in pipe-delimited goals string)
ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS exercise_likes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS exercise_dislikes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS training_background text DEFAULT '',
  ADD COLUMN IF NOT EXISTS additional_notes text DEFAULT '';

-- Check constraints for enum-like columns
ALTER TABLE client_profiles
  ADD CONSTRAINT chk_sleep_hours
    CHECK (sleep_hours IS NULL OR sleep_hours IN ('5_or_less', '6', '7', '8_plus'));

ALTER TABLE client_profiles
  ADD CONSTRAINT chk_stress_level
    CHECK (stress_level IS NULL OR stress_level IN ('low', 'moderate', 'high', 'very_high'));

ALTER TABLE client_profiles
  ADD CONSTRAINT chk_occupation_activity_level
    CHECK (occupation_activity_level IS NULL OR occupation_activity_level IN ('sedentary', 'light', 'moderate', 'heavy'));

ALTER TABLE client_profiles
  ADD CONSTRAINT chk_movement_confidence
    CHECK (movement_confidence IS NULL OR movement_confidence IN ('learning', 'comfortable', 'proficient', 'expert'));
