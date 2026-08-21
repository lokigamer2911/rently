const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { requireAuth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true);
    const error = new Error('Only image uploads are allowed');
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
