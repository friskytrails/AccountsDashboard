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

// Helper: get supplier outflows from ft_booking_system -> bookings.services.payments filtered by payment date
async function getBookingSupplierOutflows(startDate, endDate) {
  const db = getBookingDB();
  if (!db) return { total: 0, byDay: {}, byCategory: {} };

  const bookingsCollection = db.collection('bookings');

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
      $project: {
        amount: '$services.payments.paidAmount',
        date: '$services.payments.paymentDateObj',
        category: '$services.supplierType'
      }
    }
  ];

  const results = await bookingsCollection.aggregate(pipeline).toArray();

  let total = 0;
  const byDay = {};
  const byCategory = {};

  results.forEach(r => {
    const amt = Math.round(Number(r.amount || 0));
    if (amt <= 0) return;

    total += amt;

    // Categorization based on supplierType (Hotels, Transport, Adventure, etc.)
    let cat = 'SUPPLIERS';
    if (r.category) {
      const typeStr = r.category.toLowerCase();
      if (typeStr.includes('hotel')) cat = 'HOTELS';
      else if (typeStr.includes('transport')) cat = 'TRANSPORT';
      else if (typeStr.includes('guide')) cat = 'GUIDES';
      else if (typeStr.includes('adventure') || typeStr.includes('sightseeing')) cat = 'SIGHTSEEING';
      else cat = r.category.toUpperCase();
    }
    byCategory[cat] = (byCategory[cat] || 0) + amt;

    // Day of payment mapped from payment date
    const dateObj = r.date ? new Date(r.date) : null;
    const day = dateObj ? dateObj.getDate() : 1;
    byDay[day] = (byDay[day] || 0) + amt;
  });

  return { total, byDay, byCategory };
}

// Helper: get manual transactions recorded in accounts_dashboard
async function getManualFlows(startDate, endDate) {
  try {
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    let manualInflow = 0;
    let manualOutflow = 0;
    const inflowByDay = {};
    const outflowByDay = {};
    const categoryOutflows = {};

    transactions.forEach(t => {
      const amt = Math.round(Number(t.amount || 0));
      if (amt <= 0) return;
      const day = new Date(t.date).getDate();

      if (t.type === 'INFLOW') {
        manualInflow += amt;
        inflowByDay[day] = (inflowByDay[day] || 0) + amt;
      } else if (t.type === 'OUTFLOW') {
        manualOutflow += amt;
        outflowByDay[day] = (outflowByDay[day] || 0) + amt;
        const cat = (t.category || 'OTHERS').toUpperCase();
        categoryOutflows[cat] = (categoryOutflows[cat] || 0) + amt;
      }
    });

    return { manualInflow, manualOutflow, inflowByDay, outflowByDay, categoryOutflows };
  } catch (err) {
    console.error('getManualFlows error:', err);
    return { manualInflow: 0, manualOutflow: 0, inflowByDay: {}, outflowByDay: {}, categoryOutflows: {} };
  }
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
    // 1. Live Inflows from ft_booking_system (customer booking payments)
    // 2. Live Outflows from ft_booking_system (suppliers totalAmountPaid via createdAt)
    // 3. Manual Flows from accounts_dashboard (recorded journal entries)
    const [bookingInflows, supplierOutflows, manualFlows] = await Promise.all([
      getBookingInflows(startDate, endDate),
      getBookingSupplierOutflows(startDate, endDate),
      getManualFlows(startDate, endDate)
    ]);

    const totalInflow = bookingInflows.total + manualFlows.manualInflow;
    const totalOutflow = supplierOutflows.total + manualFlows.manualOutflow;
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
    const [prevBookingInflows, prevSupplierOutflows, prevManualFlows] = await Promise.all([
      getBookingInflows(prevStart, prevEnd),
      getBookingSupplierOutflows(prevStart, prevEnd),
      getManualFlows(prevStart, prevEnd)
    ]);
    const prevTotalInflow = prevBookingInflows.total + prevManualFlows.manualInflow;
    const prevTotalOutflow = prevSupplierOutflows.total + prevManualFlows.manualOutflow;
    const prevNetCashFlow = prevTotalInflow - prevTotalOutflow;

    // % changes helper
    const pct = (curr, prev) => (prev === 0 ? null : +(((curr - prev) / prev) * 100).toFixed(1));

    // Category Breakdown: Merge supplier disbursements + manual expense categories
    const mergedCategories = { ...supplierOutflows.byCategory };
    Object.entries(manualFlows.categoryOutflows).forEach(([cat, amt]) => {
      mergedCategories[cat] = (mergedCategories[cat] || 0) + amt;
    });

    const categoryBreakdown = Object.entries(mergedCategories)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalOutflow > 0 ? +((amount / totalOutflow) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Build complete daily trend array for every day of the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyTrend = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const inflow = (bookingInflows.byDay[day] || 0) + (manualFlows.inflowByDay[day] || 0);
      const outflow = (supplierOutflows.byDay[day] || 0) + (manualFlows.outflowByDay[day] || 0);
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
      manualInflow: manualFlows.manualInflow,
      supplierOutflow: supplierOutflows.total,
      manualOutflow: manualFlows.manualOutflow,
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
      categoryBreakdown,
      dailyTrend
    });
  } catch (err) {
    console.error('getMonthlySummary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getMonthlySummary, getBookingInflows, getBookingSupplierOutflows, getManualFlows };
