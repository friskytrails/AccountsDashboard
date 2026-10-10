const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getLiveInflows,
  getLiveOutflows,
  addTransaction,
  deleteTransaction,
  editTransaction
} = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/authMiddleware');

// Routes mounted at /api/transactions
router.get('/', requireAuth, getTransactions);
router.get('/live-inflows', requireAuth, getLiveInflows);
router.get('/live-outflows', requireAuth, getLiveOutflows);
router.post('/', requireAuth, addTransaction);
router.put('/:id', requireAuth, editTransaction);
router.delete('/:id', requireAuth, deleteTransaction);

module.exports = router;
