const express = require('express');
const protect = require('../middleware/auth');
const upload = require('../middleware/upload');
const c = require('../controllers/projectController');

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('image'), c.upload);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;