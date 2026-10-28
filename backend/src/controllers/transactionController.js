const Transaction = require('../models/Transaction');
const { getBookingDB } = require('../config/bookingDb');

const VALID_CATEGORIES = ['SALARIES', 'SUPPLIERS', 'OPERATIONS', 'HOTELS', 'TRANSPORT', 'GUIDES', 'SIGHTSEEING', 'MARKETING', 'OTHERS'];
const VALID_PAYMENT_MODES = [
  'Kalpana BOI',
  'Kalpana PNB',
  'Babita AU',
  'Hari Mohan BOB',
  'FT HDFC',
  'Pratyush SBI',
  'Cash',
  'Other',
  'UPI',
  'BANK_TRANSFER',
  'CASH',
  'CARD',
  'CHEQUE',
  'OTHER',
  'Supplier'
];

// GET /api/transactions?month=9&year=2026&type=OUTFLOW&page=1&limit=20
async function getTransactions(req, res) {
  try {
    const { month, year, type, category, paymentMode, page = 1, limit = 20 } = req.query;
    const filter = {};

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (!isNaN(monthNum) && !isNaN(yearNum) && monthNum >= 1 && monthNum <= 12 && yearNum >= 2000) {
      const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (paymentMode) filter.paymentMode = paymentMode;

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
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    const hasMonth = !isNaN(month) && month >= 1 && month <= 12;
    const hasYear = !isNaN(year) && year >= 2000;

    const db = getBookingDB();
    if (!db) return res.json({ inflows: [], totalAmount: 0, count: 0 });

    const matchConditions = [
      {
        $or: [
          { 'payments.status': { $in: ['VERIFIED', 'PAID'] } },
          { 'payments.verified': true }
        ]
      },
      { 'payments.status': { $nin: ['REJECTED', 'DISAPPROVED'] } }
    ];

    if (hasMonth && hasYear) {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      matchConditions.push({ 'payments.paymentDateObj': { $gte: startDate, $lte: endDate } });
    }

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
          $and: matchConditions
        }
      },
      {
        $project: {
          _id: '$payments._id',
          bookingId: '$bookingId',
          travellerName: '$travellerName',
          travellerEmail: '$travellerEmail',
          travellerPhone: '$travellerPhone',
          location: '$location',
          packageName: '$packageName',
          paymentId: '$payments.paymentId',
          amountPaid: '$payments.amountPaid',
          paymentMode: '$payments.paymentMode',
          paymentDate: '$payments.paymentDateObj',
          status: '$payments.status',
          verified: '$payments.verified',
          addedBy: '$payments.addedBy',
          startDate: '$startDate',
          endDate: '$endDate',
          totalBookingAmount: '$totalAmount',
          dueAmount: '$dueAmount',
          assignedTo: '$assignedTo',
          adults: '$adults',
          children: '$children',
          details: '$payments.details',
          attachment: '$payments.attachment',
          attachmentName: '$payments.attachmentName',
          invoiceNumber: '$payments.invoiceNumber',
          bookingTransactionId: '$transactionId'
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
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    const hasMonth = !isNaN(month) && month >= 1 && month <= 12;
    const hasYear = !isNaN(year) && year >= 2000;

    const db = getBookingDB();
    if (!db) return res.json({ outflows: [], totalAmount: 0, count: 0 });

    const matchConditions = [
      {
        $or: [
          { 'services.payments.status': { $in: ['VERIFIED', 'PAID'] } },
          { 'services.payments.verified': true }
        ]
      },
      { 'services.payments.status': { $nin: ['REJECTED', 'DISAPPROVED'] } }
    ];

    if (hasMonth && hasYear) {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      matchConditions.push({ 'services.payments.paymentDateObj': { $gte: startDate, $lte: endDate } });
    }

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
          $and: matchConditions
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
      paymentMode: paymentMode || 'Kalpana BOI',
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

// GET /api/transactions/booking-creators
// Returns distinct users (from ft_booking_system.users) for the Created By dropdown
async function getBookingCreators(req, res) {
  try {
    const db = getBookingDB();
    if (!db) return res.json({ creators: [] });

    const users = await db
      .collection('users')
      .find({}, { projection: { name: 1, email: 1 } })
      .sort({ name: 1 })
      .toArray();

    const creators = users.map(u => ({
      id: u._id.toString(),
      name: u.name || u.email || 'Unknown'
    }));

    res.json({ creators });
  } catch (err) {
    console.error('getBookingCreators error:', err);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
}

// GET /api/transactions/profit-margins
// Aggregates bookings with profit margin details, supporting comprehensive filters:
//   bookingId, status, createdBy, fromDate, toDate,
//   serviceStartDate, serviceEndDate, phone, viewAll, page, limit
async function getBookingMargins(req, res) {
  try {
    const db = getBookingDB();
    if (!db) {
      return res.json({
        summary: { totalPackageCost: 0, totalPaidAmount: 0, totalDueAmount: 0, totalProfitMargin: 0, overallMarginPercent: 0, totalCount: 0 },
        bookings: [],
        pagination: { page: 1, limit: 50, totalPages: 0, total: 0 }
      });
    }

    const {
      bookingId,
      status,
      createdBy,
      fromDate,
      toDate,
      serviceStartDate,
      serviceEndDate,
      phone,
      viewAll,
      page = 1,
      limit = 50
    } = req.query;

    const isViewAll = viewAll === 'true' || viewAll === true;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const maxLimit = isViewAll ? 10000 : 500;
    const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Build the match stage
    const match = {};

    if (bookingId && bookingId.trim()) {
      const q = bookingId.trim();
      match.$or = [
        { bookingId: { $regex: q, $options: 'i' } },
        { transactionId: { $regex: q, $options: 'i' } },
        { paymentId: { $regex: q, $options: 'i' } },
        { 'payments.paymentId': { $regex: q, $options: 'i' } },
        { 'payments.details': { $regex: q, $options: 'i' } },
        { 'payments.invoiceNumber': { $regex: q, $options: 'i' } }
      ];
    }
    if (status && status !== 'ALL' && status !== '') {
      match.status = status;
    }
    if (createdBy && createdBy !== 'ALL' && createdBy !== '') {
      const mongoose = require('mongoose');
      const conditions = [createdBy.toString()];
      if (mongoose.Types.ObjectId.isValid(createdBy)) {
        conditions.push(new mongoose.Types.ObjectId(createdBy));
      }
      match.createdBy = { $in: conditions };
    }
    if (phone && phone.trim()) {
      match.travellerPhone = { $regex: phone.trim().replace(/[^\d]/g, ''), $options: 'i' };
    }

    // Booking date range (createdAt)
    if (!viewAll || viewAll === 'false') {
      if (fromDate || toDate) {
        match.createdAt = {};
        if (fromDate) match.createdAt.$gte = new Date(fromDate);
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          match.createdAt.$lte = to;
        }
      }
    }

    // Service date range (startDate / endDate of trip)
    if (serviceStartDate) {
      match.startDate = { $gte: new Date(serviceStartDate) };
    }
    if (serviceEndDate) {
      match.endDate = { $lte: (() => { const d = new Date(serviceEndDate); d.setHours(23,59,59,999); return d; })() };
    }

    // Pipeline: add marginPercentage, lookup creator name, facet for summary + paged rows
    const pipeline = [
      { $match: match },
      {
        $addFields: {
          marginPercentage: {
            $cond: [
              { $gt: [{ $toDouble: '$totalAmount' }, 0] },
              {
                $multiply: [
                  { $divide: [{ $toDouble: { $ifNull: ['$profitMargin', 0] } }, { $toDouble: '$totalAmount' }] },
                  100
                ]
              },
              0
            ]
          },
          createdByStr: { $toString: '$createdBy' }
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { cbId: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$cbId'] },
                    { $eq: [{ $toString: '$_id' }, { $toString: '$$cbId' }] }
                  ]
                }
              }
            },
            { $project: { name: 1 } }
          ],
          as: 'creatorDoc'
        }
      },
      {
        $addFields: {
          creatorName: {
            $ifNull: [{ $arrayElemAt: ['$creatorDoc.name', 0] }, 'Unknown']
          }
        }
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalPackageCost: { $sum: { $toDouble: { $ifNull: ['$totalAmount', 0] } } },
                totalPaidAmount: { $sum: { $toDouble: { $ifNull: ['$paidAmount', 0] } } },
                totalDueAmount: { $sum: { $toDouble: { $ifNull: ['$dueAmount', 0] } } },
                totalProfitMargin: { $sum: { $toDouble: { $ifNull: ['$profitMargin', 0] } } },
                totalCount: { $sum: 1 }
              }
            }
          ],
          bookings: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: 0,
                bookingId: 1,
                travellerName: 1,
                travellerPhone: 1,
                packageName: 1,
                location: 1,
                totalAmount: 1,
                paidAmount: 1,
                dueAmount: 1,
                profitMargin: 1,
                marginPercentage: { $round: ['$marginPercentage', 2] },
                startDate: 1,
                endDate: 1,
                status: 1,
                tripStatus: 1,
                createdAt: 1,
                creatorName: 1,
                adults: 1,
                children: 1
              }
            }
          ]
        }
      }
    ];

    const [result] = await db.collection('bookings').aggregate(pipeline).toArray();

    const rawSummary = result?.summary?.[0] || {};
    const totalPackageCost = Math.round(rawSummary.totalPackageCost || 0);
    const totalPaidAmount = Math.round(rawSummary.totalPaidAmount || 0);
    const totalDueAmount = Math.round(rawSummary.totalDueAmount || 0);
    const totalProfitMargin = Math.round(rawSummary.totalProfitMargin || 0);
    const totalCount = rawSummary.totalCount || 0;
    const overallMarginPercent =
      totalPackageCost > 0
        ? +((totalProfitMargin / totalPackageCost) * 100).toFixed(2)
        : 0;

    const bookings = (result?.bookings || []).map(b => ({
      ...b,
      totalAmount: Math.round(Number(b.totalAmount || 0)),
      paidAmount: Math.round(Number(b.paidAmount || 0)),
      dueAmount: Math.round(Number(b.dueAmount || 0)),
      profitMargin: Math.round(Number(b.profitMargin || 0)),
      marginPercentage: +(b.marginPercentage || 0).toFixed(2)
    }));

    res.json({
      summary: {
        totalPackageCost,
        totalPaidAmount,
        totalDueAmount,
        totalProfitMargin,
        overallMarginPercent,
        totalCount
      },
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        total: totalCount
      }
    });
  } catch (err) {
    console.error('getBookingMargins error:', err);
    res.status(500).json({ error: 'Failed to fetch booking margins' });
  }
}

module.exports = {
  getTransactions,
  getLiveInflows,
  getLiveOutflows,
  addTransaction,
  deleteTransaction,
  editTransaction,
  getBookingCreators,
  getBookingMargins
};
