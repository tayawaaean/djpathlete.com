-- ============================================================================
-- Migration 00030: Extend AI generation log for Cloud Tasks step tracking
-- Adds step-based status values and progress tracking columns.
-- ============================================================================

-- Drop and recreate the status CHECK constraint to include step statuses
ALTER TABLE ai_generation_log
  DROP CONSTRAINT IF EXISTS ai_generation_log_status_check;

ALTER TABLE ai_generation_log
  ADD CONSTRAINT ai_generation_log_status_check
    CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'step_1', 'step_2', 'step_3'));

-- Add step tracking columns
ALTER TABLE ai_generation_log
  ADD COLUMN IF NOT EXISTS current_step smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_steps smallint NOT NULL DEFAULT 3;
