const express = require('express');
const router = express.Router();
const { getTransactions, addTransaction, deleteTransaction, editTransaction } = require('../controllers/transactionController');

// Routes mounted at /api/transactions
router.get('/', getTransactions);
router.post('/', addTransaction);
router.put('/:id', editTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
