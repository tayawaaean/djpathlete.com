-- Fix foreign keys that block user deletion.
-- Tables with user_id should cascade; authorship columns (created_by,
-- assigned_by, requested_by) should set null so we keep the records.

-- assessment_results.user_id — 00036 dropped the ON DELETE CASCADE from 00033
ALTER TABLE assessment_results
  DROP CONSTRAINT IF EXISTS assessment_results_user_id_fkey,
  ADD CONSTRAINT assessment_results_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- programs.created_by — set null so programs survive admin deletion
ALTER TABLE programs
  DROP CONSTRAINT IF EXISTS programs_created_by_fkey,
  ADD CONSTRAINT programs_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- exercises.created_by — set null so exercises survive admin deletion
ALTER TABLE exercises
  DROP CONSTRAINT IF EXISTS exercises_created_by_fkey,
  ADD CONSTRAINT exercises_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- program_assignments.assigned_by — set null so assignment history survives
ALTER TABLE program_assignments
  DROP CONSTRAINT IF EXISTS program_assignments_assigned_by_fkey,
  ADD CONSTRAINT program_assignments_assigned_by_fkey
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- ai_generation_log.requested_by — set null so audit log survives
ALTER TABLE ai_generation_log
  ALTER COLUMN requested_by DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS ai_generation_log_requested_by_fkey,
  ADD CONSTRAINT ai_generation_log_requested_by_fkey
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL;
