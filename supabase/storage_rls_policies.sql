-- Home Connect: Private Supabase Storage RLS Configuration for Third-Party Firebase Auth
-- Project: home-connect-a2350 | Bucket: homecraft-assets (Private)
--
-- Why this SQL is required:
-- Firebase Authentication ID tokens contain standard OIDC claims (`iss`, `aud`, `sub`)
-- and do NOT include a `"role": "authenticated"` claim. Standard Supabase RLS policies
-- using `TO authenticated` or `auth.uid()` (which casts `sub` to Postgres uuid) reject
-- valid Firebase users with 403 Unauthorized ("new row violates row-level security policy")
-- because Firebase UIDs are 28-character Base62 strings, not UUIDs.
--
-- Prerequisites in Supabase Dashboard -> Authentication -> Third-Party Auth:
--   Add Firebase Auth provider for project ID: home-connect-a2350
--   Run this entire file in the kydansbijexhxqvakwuu project SQL Editor
--
-- If SQL Editor returns 42501 ("must be owner of table objects"), do not run
-- any ALTER TABLE or CREATE POLICY statement manually. Create the equivalent
-- policies from Supabase Dashboard -> Storage -> Policies. The app already
-- sends the required public key and Firebase ID token.

-- 1. Keep homecraft-assets private with strict MIME & 5MB file size limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homecraft-assets',
  'homecraft-assets',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Drop any pre-existing policies for homecraft-assets to avoid conflicts
DROP POLICY IF EXISTS "Firebase users can view homecraft assets" ON storage.objects;
DROP POLICY IF EXISTS "Firebase users can upload own homecraft assets" ON storage.objects;
DROP POLICY IF EXISTS "Firebase users can delete own homecraft assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 3. SELECT policy (required for generating signed retrieval URLs in private bucket)
-- Marketplace products and seller logos are readable by valid Firebase users.
-- Custom-request attachments remain owner-only by matching the UID path segment.
-- Anonymous callers and JWTs with the wrong issuer or audience are denied.
CREATE POLICY "Firebase users can view homecraft assets"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'homecraft-assets'
  AND (auth.jwt() ->> 'iss') = 'https://securetoken.google.com/home-connect-a2350'
  AND (auth.jwt() ->> 'aud') = 'home-connect-a2350'
  AND COALESCE(auth.jwt() ->> 'sub', '') <> ''
  AND (
    (storage.foldername(name))[1] IN ('products', 'seller-logos')
    OR (
      (storage.foldername(name))[1] = 'custom-requests'
      AND (storage.foldername(name))[2] = (auth.jwt() ->> 'sub')
    )
  )
);

-- 4. INSERT policy (strict per-user UID path ownership)
-- Enforces path format: <category>/<firebase_uid>/<filename>
-- Uses `(auth.jwt() ->> 'sub')` as text instead of `auth.uid()` (non-UUID Firebase UID).
CREATE POLICY "Firebase users can upload own homecraft assets"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'homecraft-assets'
  AND (auth.jwt() ->> 'iss') = 'https://securetoken.google.com/home-connect-a2350'
  AND (auth.jwt() ->> 'aud') = 'home-connect-a2350'
  AND COALESCE(auth.jwt() ->> 'sub', '') <> ''
  AND (storage.foldername(name))[1] IN ('products', 'seller-logos', 'custom-requests')
  AND (storage.foldername(name))[2] = (auth.jwt() ->> 'sub')
);

-- 5. DELETE policy (strict owner-only deletion)
CREATE POLICY "Firebase users can delete own homecraft assets"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (
  bucket_id = 'homecraft-assets'
  AND (auth.jwt() ->> 'iss') = 'https://securetoken.google.com/home-connect-a2350'
  AND (auth.jwt() ->> 'aud') = 'home-connect-a2350'
  AND COALESCE(auth.jwt() ->> 'sub', '') <> ''
  AND (storage.foldername(name))[1] IN ('products', 'seller-logos', 'custom-requests')
  AND (storage.foldername(name))[2] = (auth.jwt() ->> 'sub')
);
