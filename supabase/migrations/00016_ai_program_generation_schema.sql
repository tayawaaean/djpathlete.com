-- ============================================================================
-- Migration 00016: AI Program Generation Schema Upgrade
-- Adds rich exercise metadata, exercise relationships, intensity prescriptions,
-- structured client data, and AI generation tracking.
-- ============================================================================

-- ============================================================================
-- A. Exercises — Rich metadata for AI selection
-- ============================================================================

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS movement_pattern text CHECK (movement_pattern IN (
    'push', 'pull', 'squat', 'hinge', 'lunge', 'carry', 'rotation', 'isometric', 'locomotion'
  )),
  ADD COLUMN IF NOT EXISTS primary_muscles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secondary_muscles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS force_type text CHECK (force_type IN ('push', 'pull', 'static', 'dynamic')),
  ADD COLUMN IF NOT EXISTS laterality text CHECK (laterality IN ('bilateral', 'unilateral', 'alternating')),
  ADD COLUMN IF NOT EXISTS equipment_required text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_bodyweight boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_compound boolean NOT NULL DEFAULT true;

-- Indexes for AI querying (only active exercises)
CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern ON exercises (movement_pattern) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises (category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscles ON exercises USING gin (primary_muscles) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_exercises_equipment_required ON exercises USING gin (equipment_required) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises (difficulty) WHERE is_active = true;

-- ============================================================================
-- B. Exercise Relationships — Progressions & alternatives
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  related_exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('progression', 'regression', 'alternative', 'variation')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT no_self_reference CHECK (exercise_id <> related_exercise_id),
  CONSTRAINT unique_relationship UNIQUE (exercise_id, related_exercise_id, relationship_type)
);

-- RLS
ALTER TABLE exercise_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercise_relationships_select ON exercise_relationships
  FOR SELECT USING (true);

CREATE POLICY exercise_relationships_admin ON exercise_relationships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ============================================================================
-- C. Programs — Training philosophy + AI tracking
-- ============================================================================

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS split_type text CHECK (split_type IN (
    'full_body', 'upper_lower', 'push_pull_legs', 'push_pull', 'body_part', 'movement_pattern', 'custom'
  )),
  ADD COLUMN IF NOT EXISTS periodization text CHECK (periodization IN (
    'linear', 'undulating', 'block', 'reverse_linear', 'none'
  )),
  ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_generation_params jsonb;

-- ============================================================================
-- D. Program Exercises — Intensity prescriptions
-- ============================================================================

ALTER TABLE program_exercises
  ADD COLUMN IF NOT EXISTS rpe_target numeric CHECK (rpe_target >= 1 AND rpe_target <= 10),
  ADD COLUMN IF NOT EXISTS intensity_pct numeric CHECK (intensity_pct >= 0 AND intensity_pct <= 100),
  ADD COLUMN IF NOT EXISTS tempo text,
  ADD COLUMN IF NOT EXISTS group_tag text;

-- ============================================================================
-- E. Client Profiles — Structured personalization data
-- ============================================================================

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS available_equipment text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_session_minutes integer CHECK (preferred_session_minutes >= 15 AND preferred_session_minutes <= 180),
  ADD COLUMN IF NOT EXISTS preferred_training_days integer CHECK (preferred_training_days >= 1 AND preferred_training_days <= 7),
  ADD COLUMN IF NOT EXISTS injury_details jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS training_years numeric;

-- ============================================================================
-- F. AI Generation Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES programs(id) ON DELETE SET NULL,
  client_id uuid REFERENCES users(id) ON DELETE SET NULL,
  requested_by uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  input_params jsonb NOT NULL,
  output_summary jsonb,
  error_message text,
  model_used text,
  tokens_used integer,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- RLS
ALTER TABLE ai_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_generation_log_admin_select ON ai_generation_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );
