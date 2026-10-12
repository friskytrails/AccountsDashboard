const express = require('express');
const router = express.Router();
const { getMonthlySummary } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');

// GET /api/dashboard/summary?month=9&year=2026
router.get('/summary', requireAuth, getMonthlySummary);

module.exports = router;
