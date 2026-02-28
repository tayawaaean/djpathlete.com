-- Create avatars storage bucket for user profile pictures.
-- Uses service-role uploads from the API route, so we only need
-- a public read policy for serving images.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read avatar files (they're public profile pictures)
CREATE POLICY "Public avatar read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Service-role handles all uploads/deletes from the API route,
-- so no authenticated insert/update/delete policies are needed.
