const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', requireAuth, getMe);

module.exports = router;
