-- Remove exercise_id and assignment_id from form_reviews
-- Form reviews now only use the title field to identify what's being reviewed
-- =====================================================================

ALTER TABLE form_reviews DROP COLUMN IF EXISTS exercise_id;
ALTER TABLE form_reviews DROP COLUMN IF EXISTS assignment_id;
