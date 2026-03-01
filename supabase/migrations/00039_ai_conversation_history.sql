-- AI Conversation History
-- Stores individual messages from all AI features for learning, RAG, and feedback

CREATE TABLE IF NOT EXISTS ai_conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context linkage
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN (
    'program_generation', 'program_chat', 'admin_chat', 'ai_coach'
  )),
  session_id text NOT NULL,

  -- Message content
  role text NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content text NOT NULL,

  -- Contextual metadata (feature-specific: client_id, exercise_id, model, step, tool_calls)
  metadata jsonb NOT NULL DEFAULT '{}',

  -- Vector embedding (384 dims = all-MiniLM-L6-v2 via @huggingface/transformers)
  embedding vector(384),

  -- Token tracking
  tokens_input integer,
  tokens_output integer,
  model_used text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Query indexes
CREATE INDEX idx_ai_conv_user_feature ON ai_conversation_history(user_id, feature);
CREATE INDEX idx_ai_conv_session ON ai_conversation_history(session_id);
CREATE INDEX idx_ai_conv_feature_role ON ai_conversation_history(feature, role);
CREATE INDEX idx_ai_conv_created ON ai_conversation_history(created_at DESC);

-- HNSW vector index for fast approximate nearest-neighbor search
CREATE INDEX idx_ai_conv_embedding
  ON ai_conversation_history USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

-- Similarity search function (mirrors match_exercises pattern from migration 00025)
CREATE OR REPLACE FUNCTION match_ai_conversations(
  query_embedding vector(384),
  target_feature text DEFAULT NULL,
  exclude_session text DEFAULT NULL,
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  session_id text,
  feature text,
  role text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    h.id,
    h.session_id,
    h.feature,
    h.role,
    h.content,
    h.metadata,
    1 - (h.embedding <=> query_embedding) AS similarity
  FROM ai_conversation_history h
  WHERE h.embedding IS NOT NULL
    AND (target_feature IS NULL OR h.feature = target_feature)
    AND (exclude_session IS NULL OR h.session_id != exclude_session)
    AND 1 - (h.embedding <=> query_embedding) > match_threshold
  ORDER BY h.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- RLS
ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;

-- Admins can read all conversations
CREATE POLICY ai_conv_admin_select ON ai_conversation_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Clients can read their own conversations
CREATE POLICY ai_conv_client_own ON ai_conversation_history
  FOR SELECT USING (user_id = auth.uid());
