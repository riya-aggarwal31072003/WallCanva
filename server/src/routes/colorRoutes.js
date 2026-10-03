const express = require('express');
const protect = require('../middleware/auth');
const requireAdmin = require('../middleware/role');
const c = require('../controllers/colorController');

const router = express.Router();

router.get('/', protect, c.getColors);
router.get('/:id', protect, c.getColor);
router.post('/', protect, requireAdmin, c.createColor);
router.put('/:id', protect, requireAdmin, c.updateColor);
router.delete('/:id', protect, requireAdmin, c.deleteColor);

module.exports = router;