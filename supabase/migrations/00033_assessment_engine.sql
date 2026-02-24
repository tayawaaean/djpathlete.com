-- Assessment questions (coach-editable from admin)
CREATE TABLE assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('movement_screen', 'background', 'context', 'preferences')),
  movement_pattern text,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('yes_no', 'single_select', 'multi_select', 'number', 'text')),
  options jsonb,
  parent_question_id uuid REFERENCES assessment_questions(id) ON DELETE SET NULL,
  parent_answer text,
  level_impact jsonb,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Assessment results (one per client per assessment)
CREATE TABLE assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_type text NOT NULL CHECK (assessment_type IN ('initial', 'reassessment')),
  answers jsonb NOT NULL DEFAULT '{}',
  computed_levels jsonb NOT NULL DEFAULT '{}',
  max_difficulty_score integer NOT NULL DEFAULT 5,
  triggered_program_id uuid REFERENCES programs(id) ON DELETE SET NULL,
  previous_assessment_id uuid REFERENCES assessment_results(id) ON DELETE SET NULL,
  feedback jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_assessment_questions_section ON assessment_questions(section);
CREATE INDEX idx_assessment_questions_parent ON assessment_questions(parent_question_id);
CREATE INDEX idx_assessment_results_user ON assessment_results(user_id);
CREATE INDEX idx_assessment_results_type ON assessment_results(assessment_type);

-- Seed default movement screen questions
INSERT INTO assessment_questions (section, movement_pattern, question_text, question_type, parent_question_id, parent_answer, level_impact, order_index) VALUES
  -- Squat pattern
  ('movement_screen', 'squat', 'Can you perform a bodyweight squat to parallel with good form?', 'yes_no', NULL, NULL, '{"yes": 2, "no": 0}', 1),
  ('movement_screen', 'squat', 'Can you back squat your bodyweight?', 'yes_no', NULL, NULL, '{"yes": 3, "no": 0}', 2),
  ('movement_screen', 'squat', 'Can you back squat 1.5x your bodyweight?', 'yes_no', NULL, NULL, '{"yes": 2, "no": 0}', 3),
  -- Push pattern
  ('movement_screen', 'push', 'Can you do 5 push-ups with good form?', 'yes_no', NULL, NULL, '{"yes": 2, "no": 0}', 4),
  ('movement_screen', 'push', 'Can you bench press your bodyweight?', 'yes_no', NULL, NULL, '{"yes": 3, "no": 0}', 5),
  -- Pull pattern
  ('movement_screen', 'pull', 'Can you do 1 strict pull-up?', 'yes_no', NULL, NULL, '{"yes": 2, "no": 0}', 6),
  ('movement_screen', 'pull', 'Can you do 10 strict pull-ups?', 'yes_no', NULL, NULL, '{"yes": 3, "no": 0}', 7),
  -- Hinge pattern
  ('movement_screen', 'hinge', 'Can you hip hinge with a flat back (deadlift pattern)?', 'yes_no', NULL, NULL, '{"yes": 2, "no": 0}', 8),
  ('movement_screen', 'hinge', 'Can you deadlift your bodyweight?', 'yes_no', NULL, NULL, '{"yes": 3, "no": 0}', 9);

-- Now update parent references for branching
-- Squat: Q2 depends on Q1=yes, Q3 depends on Q2=yes
UPDATE assessment_questions SET parent_question_id = (SELECT id FROM assessment_questions WHERE order_index = 1 AND section = 'movement_screen'), parent_answer = 'yes' WHERE order_index = 2 AND section = 'movement_screen';
UPDATE assessment_questions SET parent_question_id = (SELECT id FROM assessment_questions WHERE order_index = 2 AND section = 'movement_screen'), parent_answer = 'yes' WHERE order_index = 3 AND section = 'movement_screen';
-- Push: Q5 depends on Q4=yes
UPDATE assessment_questions SET parent_question_id = (SELECT id FROM assessment_questions WHERE order_index = 4 AND section = 'movement_screen'), parent_answer = 'yes' WHERE order_index = 5 AND section = 'movement_screen';
-- Pull: Q7 depends on Q6=yes
UPDATE assessment_questions SET parent_question_id = (SELECT id FROM assessment_questions WHERE order_index = 6 AND section = 'movement_screen'), parent_answer = 'yes' WHERE order_index = 7 AND section = 'movement_screen';
-- Hinge: Q9 depends on Q8=yes
UPDATE assessment_questions SET parent_question_id = (SELECT id FROM assessment_questions WHERE order_index = 8 AND section = 'movement_screen'), parent_answer = 'yes' WHERE order_index = 9 AND section = 'movement_screen';
