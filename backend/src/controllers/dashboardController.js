const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const MonthlyBalance = require('../models/MonthlyBalance');
const { getBookingDB } = require('../config/bookingDb');

// Helper: get booking inflows for a date range using the booking DB connection
async function getBookingInflows(startDate, endDate) {
  const db = getBookingDB();
  if (!db) return { total: 0, byDay: {} };

  const bookingsCollection = db.collection('bookings');

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
      $group: {
        _id: { $dayOfMonth: '$payments.paymentDateObj' },
        total: { $sum: { $toDouble: '$payments.amountPaid' } }
      }
    }
  ];

  const results = await bookingsCollection.aggregate(pipeline).toArray();

  let total = 0;
  const byDay = {};
  results.forEach(r => {
    const amount = Math.round(r.total || 0);
    total += amount;
    byDay[r._id] = (byDay[r._id] || 0) + amount;
  });

  return { total, byDay };
}

// GET /api/dashboard/summary?month=9&year=2026
async function getMonthlySummary(req, res) {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Previous month calculation
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = new Date(prevYear, prevMonth - 1, 1, 0, 0, 0, 0);
    const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

    // --- CURRENT MONTH INFLOWS & OUTFLOWS ---
    const bookingInflows = await getBookingInflows(startDate, endDate);

    const [manualInflowAgg, outflowAgg, categoryAgg, dailyOutflowAgg, dailyManualInflowAgg] = await Promise.all([
      // Manual inflows for the month
      Transaction.aggregate([
        { $match: { type: 'INFLOW', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Total outflows for the month
      Transaction.aggregate([
        { $match: { type: 'OUTFLOW', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Outflow grouped by category
      Transaction.aggregate([
        { $match: { type: 'OUTFLOW', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }
      ]),
      // Daily outflow by day of month
      Transaction.aggregate([
        { $match: { type: 'OUTFLOW', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $dayOfMonth: '$date' }, total: { $sum: '$amount' } } }
      ]),
      // Daily manual inflow by day of month
      Transaction.aggregate([
        { $match: { type: 'INFLOW', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $dayOfMonth: '$date' }, total: { $sum: '$amount' } } }
      ])
    ]);

    const manualInflow = manualInflowAgg[0]?.total || 0;
    const totalInflow = bookingInflows.total + manualInflow;
    const totalOutflow = outflowAgg[0]?.total || 0;
    const netCashFlow = totalInflow - totalOutflow;

    // Opening balance: closing balance of previous month from MonthlyBalance
    const prevBalance = await MonthlyBalance.findOne({ month: prevMonth, year: prevYear });
    const openingBalance = prevBalance?.closingBalance || 0;
    const closingBalance = openingBalance + netCashFlow;

    // Auto-save the closing balance snapshot for current month
    await MonthlyBalance.findOneAndUpdate(
      { month, year },
      { closingBalance, totalInflow, totalOutflow },
      { upsert: true, new: true }
    );

    // --- PREVIOUS MONTH (for comparison) ---
    const prevBookingInflows = await getBookingInflows(prevStart, prevEnd);
    const [prevManualInflowAgg, prevOutflowAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'INFLOW', date: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'OUTFLOW', date: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    const prevTotalInflow = prevBookingInflows.total + (prevManualInflowAgg[0]?.total || 0);
    const prevTotalOutflow = prevOutflowAgg[0]?.total || 0;
    const prevNetCashFlow = prevTotalInflow - prevTotalOutflow;

    // % changes helper
    const pct = (curr, prev) => (prev === 0 ? null : +(((curr - prev) / prev) * 100).toFixed(1));

    // Build complete daily trend array for every day of the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyOutflowMap = {};
    dailyOutflowAgg.forEach(d => { dailyOutflowMap[d._id] = d.total; });
    const dailyManualInflowMap = {};
    dailyManualInflowAgg.forEach(d => { dailyManualInflowMap[d._id] = d.total; });

    const dailyTrend = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const inflowFromBookings = bookingInflows.byDay[day] || 0;
      const inflowFromManual = dailyManualInflowMap[day] || 0;
      const outflow = dailyOutflowMap[day] || 0;
      const inflow = inflowFromBookings + inflowFromManual;
      return { day, inflow, outflow, net: inflow - outflow };
    });

    res.json({
      month,
      year,
      totalInflow,
      totalOutflow,
      netCashFlow,
      openingBalance,
      closingBalance,
      bookingInflow: bookingInflows.total,
      manualInflow,
      previousMonth: {
        totalInflow: prevTotalInflow,
        totalOutflow: prevTotalOutflow,
        netCashFlow: prevNetCashFlow
      },
      changes: {
        inflow: pct(totalInflow, prevTotalInflow),
        outflow: pct(totalOutflow, prevTotalOutflow),
        net: pct(netCashFlow, prevNetCashFlow)
      },
      categoryBreakdown: categoryAgg.map(c => ({
        category: c._id,
        amount: c.total,
        percentage: totalOutflow > 0 ? +((c.total / totalOutflow) * 100).toFixed(1) : 0
      })),
      dailyTrend
    });
  } catch (err) {
    console.error('getMonthlySummary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getMonthlySummary, getBookingInflows };
