const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing in environment variables.');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Helper to check if a bucket exists, and attempt to create it as public if not.
 */
async function ensureBucket(bucketName) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn('Could not list buckets (may lack admin permissions, proceeding):', listError.message);
      return;
    }
    const exists = buckets && buckets.some((b) => b.name === bucketName);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      if (createError) {
        console.warn(`Could not create bucket '${bucketName}':`, createError.message);
      } else {
        console.log(`✅ Public bucket '${bucketName}' verified/created on Supabase.`);
      }
    }
  } catch (err) {
    console.warn('ensureBucket catch:', err.message);
  }
}

/**
 * Uploads a file buffer to a specified Supabase bucket and returns the public URL.
 * Includes automatic bucket fallback and fail-safe handling if bucket permissions are restricted.
 */
async function uploadToSupabase(fileBuffer, originalName = 'image.jpg', mimeType = 'image/jpeg', bucketName = 'avatars') {
  await ensureBucket(bucketName);

  // Extract extension and generate a clean unique filename
  const cleanExt = (originalName.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt || 'jpg'}`;

  // Attempt upload to target bucket
  let uploadRes = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType: mimeType || 'image/jpeg',
      upsert: true,
    });

  // Fallback to 'avatars' bucket if target bucket doesn't exist yet on Supabase dashboard
  if (uploadRes.error && bucketName !== 'avatars') {
    console.warn(`Notice: Upload to '${bucketName}' bucket failed (${uploadRes.error.message}). Trying fallback 'avatars' bucket...`);
    uploadRes = await supabase.storage
      .from('avatars')
      .upload(fileName, fileBuffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
      });
  }

  // If Supabase Storage policies block anonymous upload, return Data URI fallback so app never crashes
  if (uploadRes.error) {
    console.warn("Supabase Storage Policy Notice:", uploadRes.error.message);
    const base64Data = fileBuffer.toString('base64');
    return `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;
  }

  const finalBucket = (uploadRes.data && uploadRes.data.path && uploadRes.data.path.includes('avatars')) ? 'avatars' : bucketName;
  const { data: publicUrlData } = supabase.storage
    .from(finalBucket)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

module.exports = {
  supabase,
  uploadToSupabase,
  ensureBucket,
};
