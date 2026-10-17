const express = require('express');
const protect = require('../middleware/auth');
const requireAdmin = require('../middleware/role');
const c = require('../controllers/adminController');

const router = express.Router();
router.use(protect, requireAdmin);

router.get('/users', c.listUsers);
router.get('/users/:id/projects', c.userProjects);

module.exports = router;