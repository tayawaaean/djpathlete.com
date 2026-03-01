-- AI Response Feedback
-- Multi-dimensional ratings on AI responses for learning and quality tracking

CREATE TABLE IF NOT EXISTS ai_response_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to conversation message
  conversation_message_id uuid NOT NULL REFERENCES ai_conversation_history(id) ON DELETE CASCADE,

  -- Who gave the feedback
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Multi-dimensional ratings (1-5 stars each, null = not rated)
  accuracy_rating smallint CHECK (accuracy_rating BETWEEN 1 AND 5),
  relevance_rating smallint CHECK (relevance_rating BETWEEN 1 AND 5),
  helpfulness_rating smallint CHECK (helpfulness_rating BETWEEN 1 AND 5),

  -- Qualitative feedback
  notes text,

  -- Quick thumbs up/down (lightweight option for clients)
  thumbs_up boolean,

  -- Feature context
  feature text NOT NULL CHECK (feature IN (
    'program_generation', 'program_chat', 'admin_chat', 'ai_coach'
  )),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One feedback per user per message
  CONSTRAINT unique_feedback_per_message UNIQUE (conversation_message_id, user_id)
);

-- Indexes
CREATE INDEX idx_ai_feedback_user ON ai_response_feedback(user_id);
CREATE INDEX idx_ai_feedback_feature ON ai_response_feedback(feature);
CREATE INDEX idx_ai_feedback_created ON ai_response_feedback(created_at DESC);
CREATE INDEX idx_ai_feedback_message ON ai_response_feedback(conversation_message_id);

-- Helper function for updated_at (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at trigger
CREATE TRIGGER set_ai_feedback_updated_at
  BEFORE UPDATE ON ai_response_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE ai_response_feedback ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY ai_feedback_admin_all ON ai_response_feedback
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Clients can insert their own feedback
CREATE POLICY ai_feedback_client_insert ON ai_response_feedback
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Clients can read their own feedback
CREATE POLICY ai_feedback_client_select ON ai_response_feedback
  FOR SELECT USING (user_id = auth.uid());
