const Transaction = require('../models/Transaction');

const VALID_CATEGORIES = ['HOTELS', 'TRANSPORT', 'GUIDES', 'SIGHTSEEING', 'SALARIES', 'MARKETING', 'OTHERS'];
const VALID_PAYMENT_MODES = ['UPI', 'BANK_TRANSFER', 'CASH', 'CARD', 'CHEQUE', 'OTHER'];

// GET /api/transactions?month=9&year=2026&type=OUTFLOW&page=1&limit=20
async function getTransactions(req, res) {
  try {
    const { month, year, type, category, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (type) filter.type = type;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Transaction.countDocuments(filter)
    ]);

    res.json({ transactions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('getTransactions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/transactions — add a new manual expense or income
async function addTransaction(req, res) {
  try {
    const { type, category, amount, description, paymentMode, referenceNumber, date } = req.body;

    if (!type || !['INFLOW', 'OUTFLOW'].includes(type)) {
      return res.status(400).json({ error: 'type must be INFLOW or OUTFLOW' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    if (paymentMode && !VALID_PAYMENT_MODES.includes(paymentMode)) {
      return res.status(400).json({ error: `paymentMode must be one of: ${VALID_PAYMENT_MODES.join(', ')}` });
    }

    const txn = new Transaction({
      type,
      category,
      amount: parsedAmount,
      description: description || '',
      paymentMode: paymentMode || 'BANK_TRANSFER',
      referenceNumber: referenceNumber || '',
      date: date ? new Date(date) : new Date(),
      addedBy: req.user?.userId || undefined,
      addedByName: req.user?.name || 'Finance Team'
    });

    await txn.save();
    res.status(201).json({ success: true, transaction: txn });
  } catch (err) {
    console.error('addTransaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/transactions/:id
async function deleteTransaction(req, res) {
  try {
    const txn = await Transaction.findByIdAndDelete(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    console.error('deleteTransaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/transactions/:id
async function editTransaction(req, res) {
  try {
    const { type, category, amount, description, paymentMode, referenceNumber, date } = req.body;
    const update = {};
    if (type) update.type = type;
    if (category) update.category = category;
    if (amount !== undefined) update.amount = parseFloat(amount);
    if (description !== undefined) update.description = description;
    if (paymentMode) update.paymentMode = paymentMode;
    if (referenceNumber !== undefined) update.referenceNumber = referenceNumber;
    if (date) update.date = new Date(date);

    const txn = await Transaction.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true, transaction: txn });
  } catch (err) {
    console.error('editTransaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getTransactions, addTransaction, deleteTransaction, editTransaction };
