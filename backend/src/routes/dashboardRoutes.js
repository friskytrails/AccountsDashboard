const express = require('express');
const router = express.Router();
const { getMonthlySummary } = require('../controllers/dashboardController');

// GET /api/dashboard/summary?month=9&year=2026
router.get('/summary', getMonthlySummary);

module.exports = router;
