const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadToSupabase } = require('../config/supabase');

const router = express.Router();

// Configure Multer for in-memory file buffering (up to 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, etc.) are allowed.'));
    }
  },
});

/**
 * @route   POST /api/upload
 * @desc    Upload an image file to Supabase Cloud Storage bucket
 * @access  Private (Requires Authentication)
 */
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded. Please attach a file field.' });
    }

    // Determine target bucket ('avatars', 'gig-images', or 'events')
    const targetBucket = req.query.bucket || req.body.bucket || 'avatars';
    const allowedBuckets = ['avatars', 'gig-images', 'events'];
    const bucket = allowedBuckets.includes(targetBucket) ? targetBucket : 'avatars';

    // Upload file buffer directly to Supabase Storage
    const publicUrl = await uploadToSupabase(
      req.file.buffer,
      req.file.originalname || 'upload.jpg',
      req.file.mimetype || 'image/jpeg',
      bucket
    );

    return res.status(200).json({
      success: true,
      message: `Image successfully uploaded to Supabase '${bucket}' bucket.`,
      url: publicUrl,
    });
  } catch (err) {
    console.error('Error in POST /api/upload:', err.message);
    return res.status(500).json({
      error: 'Failed to upload image to Supabase cloud storage.',
      details: err.message,
    });
  }
});

module.exports = router;
