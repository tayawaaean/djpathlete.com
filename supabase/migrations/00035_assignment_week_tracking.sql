-- Phase 3D: Weekly Progressive Programs
-- Add week tracking columns to program_assignments

ALTER TABLE program_assignments
  ADD COLUMN IF NOT EXISTS current_week integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_weeks integer;

-- Backfill total_weeks from the program's duration_weeks
UPDATE program_assignments pa
SET total_weeks = p.duration_weeks
FROM programs p
WHERE pa.program_id = p.id
AND pa.total_weeks IS NULL;
