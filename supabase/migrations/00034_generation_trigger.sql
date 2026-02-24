-- ============================================================================
-- Migration 00034: AI Generation Trigger Tracking
-- Adds generation_trigger and assessment_result_id to ai_generation_log
-- so we can distinguish admin-initiated from assessment-triggered generations.
-- ============================================================================

-- Create enum type for generation triggers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'generation_trigger') THEN
    CREATE TYPE generation_trigger AS ENUM ('admin_manual', 'initial_assessment', 'reassessment');
  END IF;
END $$;

-- Add columns to ai_generation_log
ALTER TABLE ai_generation_log
  ADD COLUMN IF NOT EXISTS generation_trigger text DEFAULT 'admin_manual',
  ADD COLUMN IF NOT EXISTS assessment_result_id uuid;
