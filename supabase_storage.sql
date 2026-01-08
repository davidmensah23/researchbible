-- Create Storage Bucket for Project Files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project_files', 'project_files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for project_files bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project_files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project_files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project_files' AND auth.uid()::text = (storage.foldername(name))[1]);
