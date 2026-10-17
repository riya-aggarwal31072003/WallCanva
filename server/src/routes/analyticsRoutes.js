const express = require('express');
const protect = require('../middleware/auth');
const requireAdmin = require('../middleware/role');
const c = require('../controllers/analyticsController');

const router = express.Router();
router.use(protect);

router.post('/session', c.startSession);
router.post('/session/:id/ping', c.pingSession);
router.post('/feedback', c.submitFeedback);

router.get('/stats', requireAdmin, c.stats);
router.get('/feedback', requireAdmin, c.recentFeedback);

module.exports = router;