const multer = require('multer');

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Only JPG and PNG images are allowed');
    err.status = 400;
    cb(err);
  }
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});