const Transaction = require('../models/Transaction');
const { getBookingDB } = require('../config/bookingDb');

const VALID_CATEGORIES = ['SALARIES', 'SUPPLIERS', 'OPERATIONS', 'HOTELS', 'TRANSPORT', 'GUIDES', 'SIGHTSEEING', 'MARKETING', 'OTHERS'];
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

// GET /api/transactions/live-inflows?month=9&year=2026
async function getLiveInflows(req, res) {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const db = getBookingDB();
    if (!db) return res.json({ inflows: [], totalAmount: 0, count: 0 });

    const pipeline = [
      { $unwind: '$payments' },
      {
        $addFields: {
          'payments.paymentDateObj': {
            $cond: {
              if: { $eq: [{ $type: '$payments.paymentDate' }, 'date'] },
              then: '$payments.paymentDate',
              else: { $toDate: '$payments.paymentDate' }
            }
          }
        }
      },
      {
        $match: {
          'payments.paymentDateObj': { $gte: startDate, $lte: endDate },
          $or: [
            { 'payments.status': { $in: ['VERIFIED', 'PAID'] } },
            { 'payments.verified': true }
          ],
          'payments.status': { $nin: ['REJECTED', 'DISAPPROVED'] }
        }
      },
      {
        $project: {
          _id: '$payments._id',
          bookingId: '$bookingId',
          travellerName: '$travellerName',
          location: '$location',
          packageName: '$packageName',
          paymentId: '$payments.paymentId',
          amountPaid: '$payments.amountPaid',
          paymentMode: '$payments.paymentMode',
          paymentDate: '$payments.paymentDateObj',
          status: '$payments.status',
          verified: '$payments.verified',
          addedBy: '$payments.addedBy'
        }
      },
      { $sort: { paymentDate: -1 } }
    ];

    const inflows = await db.collection('bookings').aggregate(pipeline).toArray();
    const totalAmount = inflows.reduce((sum, item) => sum + Math.round(Number(item.amountPaid || 0)), 0);

    res.json({ inflows, totalAmount, count: inflows.length });
  } catch (err) {
    console.error('getLiveInflows error:', err);
    res.status(500).json({ error: 'Failed to fetch live booking inflows' });
  }
}

// GET /api/transactions/live-outflows?month=9&year=2026
async function getLiveOutflows(req, res) {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const db = getBookingDB();
    if (!db) return res.json({ outflows: [], totalAmount: 0, count: 0 });

    const pipeline = [
      { $unwind: '$services' },
      { $unwind: '$services.payments' },
      {
        $addFields: {
          'services.payments.paymentDateObj': {
            $cond: {
              if: { $eq: [{ $type: '$services.payments.paymentDate' }, 'date'] },
              then: '$services.payments.paymentDate',
              else: { $toDate: '$services.payments.paymentDate' }
            }
          }
        }
      },
      {
        $match: {
          'services.payments.paymentDateObj': { $gte: startDate, $lte: endDate },
          $or: [
            { 'services.payments.status': { $in: ['VERIFIED', 'PAID'] } },
            { 'services.payments.verified': true }
          ],
          'services.payments.status': { $nin: ['REJECTED', 'DISAPPROVED'] }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'services.supplierSupplierId',
          foreignField: 'supplierId',
          as: 'supplierDoc'
        }
      },
      {
        $unwind: {
          path: '$supplierDoc',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: '$services.payments._id',
          bookingId: '$bookingId',
          serviceId: '$services.serviceId',
          supplierId: '$services.supplierSupplierId',
          supplierName: { $ifNull: ['$supplierDoc.businessName', { $ifNull: ['$services.supplierName', '$supplierDoc.fullName'] }] },
          contactPerson: '$supplierDoc.fullName',
          contactNumber: '$supplierDoc.contactNumber',
          city: '$supplierDoc.city',
          state: '$supplierDoc.state',
          category: '$services.supplierType',
          amount: '$services.payments.paidAmount',
          date: '$services.payments.paymentDateObj',
          paymentMode: '$services.payments.paymentMode',
          status: '$services.payments.status',
          verified: '$services.payments.verified',
          details: '$services.payments.details',
          addedByName: '$services.payments.addedBy'
        }
      },
      { $sort: { date: -1 } }
    ];

    const results = await db.collection('bookings').aggregate(pipeline).toArray();

    const outflows = results.map(s => {
      const amount = Math.round(Number(s.amount || 0));
      let cat = 'SUPPLIERS';
      if (s.category) {
        const typeStr = s.category.toLowerCase();
        if (typeStr.includes('hotel')) cat = 'HOTELS';
        else if (typeStr.includes('transport')) cat = 'TRANSPORT';
        else if (typeStr.includes('guide')) cat = 'GUIDES';
        else if (typeStr.includes('adventure') || typeStr.includes('sightseeing')) cat = 'SIGHTSEEING';
        else cat = s.category.toUpperCase();
      }

      return {
        _id: s._id,
        bookingId: s.bookingId,
        serviceId: s.serviceId,
        supplierId: s.supplierId,
        supplierName: s.supplierName || 'Supplier',
        contactPerson: s.contactPerson,
        contactNumber: s.contactNumber,
        category: cat,
        city: s.city,
        state: s.state,
        status: s.status,
        date: s.date,
        amount,
        paymentMode: s.paymentMode,
        details: s.details,
        addedByName: s.addedByName
      };
    });

    const totalAmount = outflows.reduce((sum, item) => sum + item.amount, 0);

    res.json({ outflows, totalAmount, count: outflows.length });
  } catch (err) {
    console.error('getLiveOutflows error:', err);
    res.status(500).json({ error: 'Failed to fetch live supplier outflows' });
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

module.exports = {
  getTransactions,
  getLiveInflows,
  getLiveOutflows,
  addTransaction,
  deleteTransaction,
  editTransaction
};
