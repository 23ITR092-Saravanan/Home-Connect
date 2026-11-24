import { auth } from '../firebase/config';

export const SUPABASE_URL = 'https://kydansbijexhxqvakwuu.supabase.co';
export const STORAGE_BUCKET = 'homecraft-assets';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// In-memory cache for signed URLs to reduce latency and redundant signing requests
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export interface UploadResult {
  success: boolean;
  storagePath?: string;
  signedUrl?: string;
  error?: string;
}

export class StorageService {
  /**
   * Retrieves the current Firebase user ID token for Supabase Storage Bearer authentication.
   * Uses cached token (auto-refreshed only if expired) to avoid unnecessary network round-trips.
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      return await currentUser.getIdToken(false);
    } catch (err) {
      console.warn('Failed to retrieve Firebase ID token for storage request:', err);
      return null;
    }
  }

  /**
   * Validates file size and format against strict security rules.
   */
  public static validateFile(file: File): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type "${file.type}". Allowed formats: JPEG, PNG, WEBP, GIF.`,
      };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        error: `File size exceeds the 5MB maximum limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      };
    }
    return { isValid: true };
  }

  /**
   * Uploads an image to the private Supabase Storage bucket using Firebase third-party authentication.
   * Enforces UID-based path ownership: `<category>/<firebaseUid>/<timestamp>_<filename>`.
   * Never falls back to base64 Data URLs or public bucket access.
   */
  public static async uploadImage(
    category: 'seller-logos' | 'products' | 'custom-requests',
    _entityId: string,
    file: File
  ): Promise<UploadResult> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: 'Authentication required. Please sign in before uploading images.',
      };
    }

    const token = await this.getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Unable to obtain a valid Firebase ID token for Supabase Storage.',
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(currentUser.uid)) {
      return {
        success: false,
        error: 'Upload rejected: the Firebase user ID contains unsupported path characters.',
      };
    }
    if (!SUPABASE_ANON_KEY) {
      return {
        success: false,
        error: 'Upload configuration missing: set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.',
      };
    }

    const uid = currentUser.uid;
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `${category}/${uid}/${Date.now()}_${cleanFileName}`;

    try {
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`;
      const formData = new FormData();
      formData.append('file', file, cleanFileName);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        let parsedMessage = errorText;
        try {
          const parsed = JSON.parse(errorText) as { message?: string; error?: string; statusCode?: string };
          parsedMessage = parsed.message || parsed.error || errorText;
        } catch {
          // Keep raw errorText
        }
        console.warn('Supabase storage upload failed:', uploadResponse.status, parsedMessage);
        if (uploadResponse.status === 404) {
          return {
            success: false,
            error: 'Storage setup incomplete: bucket "homecraft-assets" was not found. Run supabase/storage_rls_policies.sql in this Supabase project.',
          };
        }
        if (uploadResponse.status === 403) {
          return {
            success: false,
            error: 'Upload denied by Supabase RLS. Confirm Firebase third-party auth is enabled and run supabase/storage_rls_policies.sql.',
          };
        }
        return {
          success: false,
          error: `Upload rejected by Supabase Storage (${uploadResponse.status}): ${parsedMessage}`,
        };
      }

      // Generate initial signed URL for private bucket retrieval
      const signedUrl = await this.getSignedUrl(storagePath);
      if (!signedUrl || (!signedUrl.startsWith('http://') && !signedUrl.startsWith('https://'))) {
        return {
          success: false,
          storagePath,
          error: 'Image uploaded, but failed to generate a private signed retrieval URL.',
        };
      }

      return {
        success: true,
        storagePath,
        signedUrl,
      };
    } catch (err) {
      console.error('Error during Supabase storage upload:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error during Supabase storage upload.',
      };
    }
  }

  /**
   * Generates a signed URL for a durable private storage path.
   * Caches the signed URL for the session duration (default: 3600s).
   */
  public static async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    if (!storagePath) return '';
    if (!SUPABASE_ANON_KEY) return '';

    // Reject Data URLs if legacy data is passed; allow existing HTTP/HTTPS URLs directly
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      return storagePath;
    }
    if (storagePath.startsWith('data:')) {
      return '';
    }

    // Check cache
    const cached = signedUrlCache.get(storagePath);
    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached.url;
    }

    try {
      const token = await this.getAuthToken();
      if (!token) {
        return '';
      }

      const signEndpoint = `${SUPABASE_URL}/storage/v1/object/sign/${STORAGE_BUCKET}/${storagePath}`;
      const res = await fetch(signEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expiresIn }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.signedURL) {
          const fullSignedUrl = `${SUPABASE_URL}/storage/v1${data.signedURL}`;
          signedUrlCache.set(storagePath, {
            url: fullSignedUrl,
            expiresAt: Date.now() + expiresIn * 1000,
          });
          return fullSignedUrl;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch signed URL from Supabase:', err);
    }

    return '';
  }

  /**
   * Deletes a durable private storage object from Supabase Storage.
   * Requires Firebase authentication; Supabase RLS enforces owner UID matching.
   */
  public static async deleteImage(storagePath: string): Promise<boolean> {
    if (!storagePath || storagePath.startsWith('http') || storagePath.startsWith('data:')) {
      return true;
    }
    if (!SUPABASE_ANON_KEY) {
      console.warn('Cannot delete storage object because the Supabase public key is not configured.');
      return false;
    }

    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.warn('Cannot delete storage object without an active Firebase session.');
        return false;
      }

      const deleteEndpoint = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`;
      const res = await fetch(deleteEndpoint, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        signedUrlCache.delete(storagePath);
        return true;
      }
      const errText = await res.text().catch(() => '');
      console.warn('Supabase storage delete failed:', res.status, errText);
      return false;
    } catch (err) {
      console.warn('Failed to delete object from Supabase:', err);
      return false;
    }
  }
}
