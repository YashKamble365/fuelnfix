const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage so we get the file buffer directly
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max
});

/**
 * Helper: upload buffer to Cloudinary
 */
function uploadToCloudinary(buffer, folder, fileName) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: fileName,
                resource_type: 'image'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
}

/**
 * POST /api/upload/problem-photo
 * Uploads a problem photo to Cloudinary.
 *
 * Body (multipart/form-data):
 *   - photo: the image file
 *   - ownerName: folder name (UID or display name)
 */
router.post('/problem-photo', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const ownerNameRaw = req.body.ownerName || 'unknown';
        // Sanitize: Trim, keep only alphanumerics, replace the rest with underscores
        const ownerName = ownerNameRaw.trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');

        const safeOriginalName = (req.file.originalname || 'photo')
            .replace(/\.[^/.]+$/, '') // Remove extension first
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_');

        const publicId = `${Date.now()}_${safeOriginalName}`;
        const folder = `fuelnfix/problem_photos/${ownerName}`;

        const result = await uploadToCloudinary(req.file.buffer, folder, publicId);

        console.log(`[Upload] Problem photo uploaded to Cloudinary: ${result.secure_url}`);
        res.json({ url: result.secure_url, path: result.public_id });
    } catch (err) {
        console.error('[Upload] Failed to upload problem photo:', err);
        res.status(500).json({ error: 'Upload failed', details: err.message });
    }
});

/**
 * POST /api/upload/shop-photo
 * Uploads a shop photo to Cloudinary.
 *
 * Body (multipart/form-data):
 *   - photo: the image file
 *   - ownerUid: the Firebase UID of the provider
 */
router.post('/shop-photo', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const ownerUidRaw = req.body.ownerUid || 'unknown';
        // Sanitize ownerUid: Trim and remove any suspicious characters
        const ownerUid = ownerUidRaw.trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');

        const safeOriginalName = (req.file.originalname || 'photo')
            .replace(/\.[^/.]+$/, '') // Remove extension first
            .replace(/[^a-zA-Z0-9]/g, '_') // Remove non-alphanumeric except spaces/dash/underscore
            .replace(/_+/g, '_'); // Replace spaces/dashes with underscores

        const publicId = `${Date.now()}_${safeOriginalName}`;
        const folder = `fuelnfix/shop_photos/${ownerUid}`;

        const result = await uploadToCloudinary(req.file.buffer, folder, publicId);

        console.log(`[Upload] Shop photo uploaded to Cloudinary: ${result.secure_url}`);
        res.json({ url: result.secure_url, path: result.public_id });
    } catch (err) {
        console.error('[Upload] Failed to upload shop photo:', err);
        res.status(500).json({ error: 'Upload failed', details: err.message });
    }
});

module.exports = router;
