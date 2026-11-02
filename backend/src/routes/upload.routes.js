const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { requireAuth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per image
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype) return cb(new Error('Unable to detect file type'));
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const error = new Error('Only JPG, PNG, and WebP images are allowed');
    error.status = 400;
    cb(error);
  },
});

router.post('/', requireAuth, upload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ error: 'Please choose at least one image' });
    }

    const uploads = await Promise.all(
      (req.files || []).map(file => new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'rentrex' },
          (err, result) => err ? reject(err) : resolve(result.secure_url),
        );
        stream.end(file.buffer);
      })),
    );
    res.json({ urls: uploads });
  } catch (e) { next(e); }
});

module.exports = router;
