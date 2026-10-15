const express = require('express');
const protect = require('../middleware/auth');
const requireAdmin = require('../middleware/role');
const upload = require('../middleware/upload');
const p = require('../controllers/patternController');

const router = express.Router();

router.get('/', protect, p.getPatterns);
router.get('/:id', protect, p.getPattern);
router.post('/', protect, requireAdmin, upload.single('image'), p.createPattern);
router.put('/:id', protect, requireAdmin, p.updatePattern);
router.delete('/:id', protect, requireAdmin, p.deletePattern);

module.exports = router;