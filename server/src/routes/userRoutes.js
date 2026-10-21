const express = require('express');
const protect = require('../middleware/auth');
const c = require('../controllers/userController');

const router = express.Router();
router.use(protect);

router.get('/favourites/colors', c.getFavouriteColors);
router.post('/favourites/colors/:id', c.toggleFavouriteColor);

module.exports = router;