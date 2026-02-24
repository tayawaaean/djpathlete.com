-- Phase 3B: Assessment engine tables
-- Phase 3E: Reassessment support fields

-- Assessment questions (coach-editable from admin)
CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('movement_screen', 'background', 'context', 'preferences')),
  movement_pattern text, -- links to exercise movement_pattern for scoring
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('yes_no', 'single_select', 'multi_select', 'number', 'text')),
  options jsonb, -- for select types: [{value, label}]
  parent_question_id uuid REFERENCES assessment_questions(id),
  parent_answer text, -- show this question only if parent answered this value
  level_impact jsonb, -- how each answer maps to ability score: {"yes": 2, "no": 0}
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Assessment results (one per client per assessment)
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  assessment_type text NOT NULL CHECK (assessment_type IN ('initial', 'reassessment')),
  answers jsonb NOT NULL, -- {question_id: answer_value}
  computed_levels jsonb NOT NULL, -- {overall: "intermediate", squat: "beginner", push: "intermediate", ...}
  max_difficulty_score integer NOT NULL, -- drives exercise selection
  triggered_program_id uuid REFERENCES programs(id), -- the program AI generated from this
  previous_assessment_id uuid REFERENCES assessment_results(id), -- for reassessments
  feedback jsonb, -- {overall_feeling, exercises_too_easy[], exercises_too_hard[], new_injuries, rpe_average}
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_assessment_questions_section ON assessment_questions(section) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_assessment_questions_parent ON assessment_questions(parent_question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_type ON assessment_results(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_results_completed ON assessment_results(completed_at DESC);

-- Seed default movement screen questions
INSERT INTO assessment_questions (section, movement_pattern, question_text, question_type, level_impact, order_index) VALUES
  ('movement_screen', 'squat', 'Can you perform a bodyweight squat to parallel?', 'yes_no', '{"yes": 2, "no": 0}', 1),
  ('movement_screen', 'push', 'Can you do 5 push-ups with good form?', 'yes_no', '{"yes": 2, "no": 0}', 2),
  ('movement_screen', 'pull', 'Can you do 1 strict pull-up?', 'yes_no', '{"yes": 2, "no": 0}', 3),
  ('movement_screen', 'hinge', 'Can you hip hinge with a flat back?', 'yes_no', '{"yes": 2, "no": 0}', 4);

-- Seed follow-up (child) questions
INSERT INTO assessment_questions (section, movement_pattern, question_text, question_type, parent_question_id, parent_answer, level_impact, order_index)
SELECT
  'movement_screen', 'squat', 'Can you back squat your bodyweight?', 'yes_no',
  id, 'yes', '{"yes": 3, "no": 0}', 1
FROM assessment_questions WHERE question_text = 'Can you perform a bodyweight squat to parallel?';

INSERT INTO assessment_questions (section, movement_pattern, question_text, question_type, parent_question_id, parent_answer, level_impact, order_index)
SELECT
  'movement_screen', 'push', 'Can you bench press your bodyweight?', 'yes_no',
  id, 'yes', '{"yes": 3, "no": 0}', 2
FROM assessment_questions WHERE question_text = 'Can you do 5 push-ups with good form?';

INSERT INTO assessment_questions (section, movement_pattern, question_text, question_type, parent_question_id, parent_answer, level_impact, order_index)
SELECT
  'movement_screen', 'pull', 'Can you do 10 strict pull-ups?', 'yes_no',
  id, 'yes', '{"yes": 3, "no": 0}', 3
FROM assessment_questions WHERE question_text = 'Can you do 1 strict pull-up?';

INSERT INTO assessment_questions (section, movement_pattern, question_text, question_type, parent_question_id, parent_answer, level_impact, order_index)
SELECT
  'movement_screen', 'hinge', 'Can you deadlift your bodyweight?', 'yes_no',
  id, 'yes', '{"yes": 3, "no": 0}', 4
FROM assessment_questions WHERE question_text = 'Can you hip hinge with a flat back?';

-- Advanced follow-ups
INSERT INTO assessment_questions (section, movement_pattern, question_text, question_type, parent_question_id, parent_answer, level_impact, order_index)
SELECT
  'movement_screen', 'squat', 'Can you back squat 1.5x your bodyweight?', 'yes_no',
  id, 'yes', '{"yes": 4, "no": 0}', 1
FROM assessment_questions WHERE question_text = 'Can you back squat your bodyweight?';

INSERT INTO assessment_questions (section, movement_pattern, question_text, question_type, parent_question_id, parent_answer, level_impact, order_index)
SELECT
  'movement_screen', 'pull', 'Can you do a weighted pull-up with 50% bodyweight?', 'yes_no',
  id, 'yes', '{"yes": 4, "no": 0}', 3
FROM assessment_questions WHERE question_text = 'Can you do 10 strict pull-ups?';
