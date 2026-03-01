-- AI Outcome Tracking
-- Connects AI recommendations to actual client outcomes for accuracy measurement

CREATE TABLE IF NOT EXISTS ai_outcome_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the AI recommendation
  conversation_message_id uuid REFERENCES ai_conversation_history(id) ON DELETE SET NULL,
  generation_log_id uuid REFERENCES ai_generation_log(id) ON DELETE SET NULL,

  -- Who and what
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE SET NULL,

  -- What the AI predicted/recommended
  recommendation_type text NOT NULL CHECK (recommendation_type IN (
    'weight_suggestion', 'program_parameters', 'exercise_selection',
    'deload_recommendation', 'plateau_detection'
  )),
  predicted_value jsonb NOT NULL,
  -- weight_suggestion: { weight_kg: 60, reps: 8 }
  -- program_parameters: { split_type: "upper_lower", periodization: "linear" }
  -- deload_recommendation: { recommended: true }
  -- plateau_detection: { detected: true }

  -- What actually happened (filled in when client logs progress)
  actual_value jsonb,

  -- Outcome metrics
  accuracy_score numeric,  -- 0.0-1.0 for quantitative predictions
  outcome_positive boolean, -- overall: did the client benefit?

  -- When the outcome was measured
  measured_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_outcome_user ON ai_outcome_tracking(user_id);
CREATE INDEX idx_ai_outcome_exercise ON ai_outcome_tracking(exercise_id);
CREATE INDEX idx_ai_outcome_type ON ai_outcome_tracking(recommendation_type);
CREATE INDEX idx_ai_outcome_pending ON ai_outcome_tracking(user_id, exercise_id)
  WHERE actual_value IS NULL;

-- RLS
ALTER TABLE ai_outcome_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_outcome_admin_all ON ai_outcome_tracking
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );
