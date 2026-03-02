-- Form Reviews: clients upload exercise videos for coach form feedback
-- =====================================================================

-- Main form_reviews table
CREATE TABLE IF NOT EXISTS form_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES program_assignments(id) ON DELETE SET NULL,
  video_path TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'reviewed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_form_reviews_client ON form_reviews(client_user_id);
CREATE INDEX idx_form_reviews_status ON form_reviews(status);
CREATE INDEX idx_form_reviews_created ON form_reviews(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_form_reviews_updated_at
  BEFORE UPDATE ON form_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Conversation thread for review feedback
CREATE TABLE IF NOT EXISTS form_review_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_review_id UUID NOT NULL REFERENCES form_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_review_messages_review ON form_review_messages(form_review_id);
CREATE INDEX idx_form_review_messages_created ON form_review_messages(created_at);

-- =====================================================================
-- RLS Policies
-- =====================================================================

ALTER TABLE form_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_review_messages ENABLE ROW LEVEL SECURITY;

-- form_reviews: clients see/create their own
CREATE POLICY "Clients can view own form reviews"
  ON form_reviews FOR SELECT
  TO authenticated
  USING (client_user_id = auth.uid());

CREATE POLICY "Clients can create own form reviews"
  ON form_reviews FOR INSERT
  TO authenticated
  WITH CHECK (client_user_id = auth.uid());

-- form_reviews: admins can view and update all
CREATE POLICY "Admins can view all form reviews"
  ON form_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all form reviews"
  ON form_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- form_review_messages: clients see/create messages on their own reviews
CREATE POLICY "Clients can view messages on own reviews"
  ON form_review_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM form_reviews
      WHERE form_reviews.id = form_review_messages.form_review_id
        AND form_reviews.client_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create messages on own reviews"
  ON form_review_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM form_reviews
      WHERE form_reviews.id = form_review_messages.form_review_id
        AND form_reviews.client_user_id = auth.uid()
    )
  );

-- form_review_messages: admins can view and create on all reviews
CREATE POLICY "Admins can view all form review messages"
  ON form_review_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create messages on all reviews"
  ON form_review_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
