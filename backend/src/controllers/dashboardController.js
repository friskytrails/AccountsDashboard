const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const MonthlyBalance = require('../models/MonthlyBalance');
const { getBookingDB } = require('../config/bookingDb');

const SIX_ACCOUNTS = [
  'Kalpana BOI',
  'Kalpana PNB',
  'Babita AU',
  'Hari Mohan BOB',
  'FT HDFC',
  'Pratyush SBI'
];

// Helper: get booking inflows for a date range using the booking DB connection, optionally filtered by account
async function getBookingInflows(startDate, endDate, account = null) {
  const db = getBookingDB();
  if (!db) return { total: 0, byDay: {}, byAccount: {} };

  const bookingsCollection = db.collection('bookings');

  const matchConditions = [
    {
      'payments.paymentDateObj': { $gte: startDate, $lte: endDate }
    },
    {
      $or: [
        { 'payments.status': { $in: ['VERIFIED', 'PAID'] } },
        { 'payments.verified': true }
      ]
    },
    {
      'payments.status': { $nin: ['REJECTED', 'DISAPPROVED'] }
    }
  ];

  if (account && account !== 'All Channels' && account !== 'ALL' && account !== 'Account Wise') {
    matchConditions.push({ 'payments.paymentMode': account });
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
      $group: {
        _id: {
          day: { $dayOfMonth: '$payments.paymentDateObj' },
          account: '$payments.paymentMode'
        },
        total: { $sum: { $toDouble: '$payments.amountPaid' } }
      }
    }
  ];

  const results = await bookingsCollection.aggregate(pipeline).toArray();

  let total = 0;
  const byDay = {};
  const byAccount = {};

  results.forEach(r => {
    const amount = Math.round(r.total || 0);
    total += amount;
    const day = r._id?.day;
    const acc = r._id?.account;
    if (day) byDay[day] = (byDay[day] || 0) + amount;
    if (acc) byAccount[acc] = (byAccount[acc] || 0) + amount;
  });

  return { total, byDay, byAccount };
}

// Helper: get supplier outflows from ft_booking_system -> bookings.services.payments filtered by payment date
async function getBookingSupplierOutflows(startDate, endDate, account = null) {
  const db = getBookingDB();
  if (!db) return { total: 0, byDay: {}, byCategory: {}, byAccount: {} };

  const bookingsCollection = db.collection('bookings');

  const matchConditions = [
    {
      'services.payments.paymentDateObj': { $gte: startDate, $lte: endDate }
    },
    {
      $or: [
        { 'services.payments.status': { $in: ['VERIFIED', 'PAID'] } },
        { 'services.payments.verified': true }
      ]
    },
    {
      'services.payments.status': { $nin: ['REJECTED', 'DISAPPROVED'] }
    }
  ];

  if (account && account !== 'All Channels' && account !== 'ALL' && account !== 'Account Wise') {
    matchConditions.push({
      $or: [
        { 'services.payments.accountSubMode': account },
        { 'services.payments.paymentMode': account }
      ]
    });
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
      $project: {
        amount: '$services.payments.paidAmount',
        date: '$services.payments.paymentDateObj',
        category: '$services.supplierType',
        account: {
          $cond: {
            if: { $and: [
              { $ne: ['$services.payments.accountSubMode', null] },
              { $ne: ['$services.payments.accountSubMode', ''] }
            ]},
            then: '$services.payments.accountSubMode',
            else: '$services.payments.paymentMode'
          }
        }
      }
    }
  ];

  const results = await bookingsCollection.aggregate(pipeline).toArray();

  let total = 0;
  const byDay = {};
  const byCategory = {};
  const byAccount = {};

  results.forEach(r => {
    const amt = Math.round(Number(r.amount || 0));
    if (amt <= 0) return;

    total += amt;

    let cat = 'OTHERS';
    if (r.category) {
      const typeStr = r.category.toLowerCase().trim();
      if (typeStr.includes('hotel')) cat = 'HOTELS';
      else if (typeStr.includes('transport')) cat = 'TRANSPORT';
      else if (typeStr.includes('adventure')) cat = 'ADVENTURE';
      else if (typeStr.includes('sightseeing') || typeStr.includes('sight')) cat = 'SIGHTSEEING';
      else if (typeStr.includes('guide')) cat = 'GUIDES';
      else if (typeStr.includes('outsourced')) cat = 'OUTSOURCED';
      else if (typeStr.includes('salary') || typeStr.includes('staff')) cat = 'STAFF_SALARIES';
      else if (typeStr.includes('marketing') || typeStr.includes('ad')) cat = 'MARKETING';
      else if (typeStr.includes('gst') || typeStr.includes('tax')) cat = 'GST';
      else cat = r.category.toUpperCase().replace(/\s+/g, '_');
    }
    byCategory[cat] = (byCategory[cat] || 0) + amt;

    const dateObj = r.date ? new Date(r.date) : null;
    const day = dateObj ? dateObj.getDate() : 1;
    byDay[day] = (byDay[day] || 0) + amt;

    const acc = r.account;
    if (acc) byAccount[acc] = (byAccount[acc] || 0) + amt;
  });

  return { total, byDay, byCategory, byAccount };
}

// Helper: get manual transactions recorded in accounts_dashboard
async function getManualFlows(startDate, endDate, account = null) {
  try {
    const query = {
      date: { $gte: startDate, $lte: endDate }
    };
    if (account && account !== 'All Channels' && account !== 'ALL' && account !== 'Account Wise') {
      query.paymentMode = account;
    }

    const transactions = await Transaction.find(query).lean();

    let manualInflow = 0;
    let manualOutflow = 0;
    const inflowByDay = {};
    const outflowByDay = {};
    const categoryOutflows = {};
    const inflowByAccount = {};
    const outflowByAccount = {};

    transactions.forEach(t => {
      const amt = Math.round(Number(t.amount || 0));
      if (amt <= 0) return;
      const day = new Date(t.date).getUTCDate();
      const acc = t.paymentMode || 'Kalpana BOI';

      if (t.type === 'INFLOW') {
        manualInflow += amt;
        inflowByDay[day] = (inflowByDay[day] || 0) + amt;
        inflowByAccount[acc] = (inflowByAccount[acc] || 0) + amt;
      } else if (t.type === 'OUTFLOW') {
        manualOutflow += amt;
        outflowByDay[day] = (outflowByDay[day] || 0) + amt;
        outflowByAccount[acc] = (outflowByAccount[acc] || 0) + amt;

        let cat = 'OTHERS';
        const rawCat = (t.category || '').toUpperCase();
        if (rawCat === 'STAFF_SALARIES' || rawCat === 'SALARIES' || rawCat.includes('STAFF')) cat = 'STAFF_SALARIES';
        else if (rawCat === 'MARKETING' || rawCat.includes('AD')) cat = 'MARKETING';
        else if (rawCat === 'GST' || rawCat.includes('TAX')) cat = 'GST';
        else if (rawCat.includes('HOTEL')) cat = 'HOTELS';
        else if (rawCat.includes('TRANSPORT')) cat = 'TRANSPORT';
        else if (rawCat.includes('ADVENTURE')) cat = 'ADVENTURE';
        else if (rawCat.includes('SIGHTSEEING') || rawCat.includes('SIGHT')) cat = 'SIGHTSEEING';
        else cat = 'OTHERS';

        categoryOutflows[cat] = (categoryOutflows[cat] || 0) + amt;
      }
    });

    return { manualInflow, manualOutflow, inflowByDay, outflowByDay, categoryOutflows, inflowByAccount, outflowByAccount };
  } catch (err) {
    console.error('getManualFlows error:', err);
    return { manualInflow: 0, manualOutflow: 0, inflowByDay: {}, outflowByDay: {}, categoryOutflows: {}, inflowByAccount: {}, outflowByAccount: {} };
  }
}

// Helper: compute prior cumulative balance before startDate for an account or all accounts
async function getPriorCumulativeNet(beforeDate, account = null) {
  const db = getBookingDB();
  let priorBookingInflow = 0;

  if (db) {
    const matchConditions = [
      {
        'payments.paymentDateObj': { $lt: beforeDate }
      },
      {
        $or: [
          { 'payments.status': { $in: ['VERIFIED', 'PAID'] } },
          { 'payments.verified': true }
        ]
      },
      {
        'payments.status': { $nin: ['REJECTED', 'DISAPPROVED'] }
      }
    ];

    if (account && account !== 'All Channels' && account !== 'ALL' && account !== 'Account Wise') {
      matchConditions.push({ 'payments.paymentMode': account });
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
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$payments.amountPaid' } }
        }
      }
    ];

    const res = await db.collection('bookings').aggregate(pipeline).toArray();
    priorBookingInflow = Math.round(res[0]?.total || 0);

    // Prior supplier outflows from ft_booking_system
    const supplierMatchConditions = [
      {
        'services.payments.paymentDateObj': { $lt: beforeDate }
      },
      {
        $or: [
          { 'services.payments.status': { $in: ['VERIFIED', 'PAID'] } },
          { 'services.payments.verified': true }
        ]
      },
      {
        'services.payments.status': { $nin: ['REJECTED', 'DISAPPROVED'] }
      }
    ];

    if (account && account !== 'All Channels' && account !== 'ALL' && account !== 'Account Wise') {
      supplierMatchConditions.push({
        $or: [
          { 'services.payments.accountSubMode': account },
          { 'services.payments.paymentMode': account }
        ]
      });
    }

    const supplierPipeline = [
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
          $and: supplierMatchConditions
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$services.payments.paidAmount' } }
        }
      }
    ];

    const supRes = await db.collection('bookings').aggregate(supplierPipeline).toArray();
    priorBookingSupplierOutflow = Math.round(supRes[0]?.total || 0);
  }

  // Prior manual transactions
  const manualQuery = { date: { $lt: beforeDate } };
  if (account && account !== 'All Channels' && account !== 'ALL' && account !== 'Account Wise') {
    manualQuery.paymentMode = account;
  }
  const priorManual = await Transaction.find(manualQuery).lean();
  let priorManualInflow = 0;
  let priorManualOutflow = 0;
  priorManual.forEach(t => {
    const amt = Math.round(Number(t.amount || 0));
    if (t.type === 'INFLOW') priorManualInflow += amt;
    else if (t.type === 'OUTFLOW') priorManualOutflow += amt;
  });

  return (priorBookingInflow + priorManualInflow) - (priorBookingSupplierOutflow + priorManualOutflow);
}

// GET /api/dashboard/summary?month=9&year=2026&account=Kalpana%20BOI
async function getMonthlySummary(req, res) {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const accountFilter = req.query.account || null;
    const isSingleAccount = Boolean(accountFilter && accountFilter !== 'All Channels' && accountFilter !== 'ALL' && accountFilter !== 'Account Wise');

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Previous month calculation
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = new Date(Date.UTC(prevYear, prevMonth - 1, 1, 0, 0, 0, 0));
    const prevEnd = new Date(Date.UTC(prevYear, prevMonth, 0, 23, 59, 59, 999));

    // 1. Current month flows (scoped to account if single account requested, else global)
    const [bookingInflows, supplierOutflows, manualFlows] = await Promise.all([
      getBookingInflows(startDate, endDate, accountFilter),
      getBookingSupplierOutflows(startDate, endDate, accountFilter),
      getManualFlows(startDate, endDate, accountFilter)
    ]);

    const totalInflow = bookingInflows.total + manualFlows.manualInflow;
    const totalOutflow = supplierOutflows.total + manualFlows.manualOutflow;
    const netCashFlow = totalInflow - totalOutflow;

    // Opening balance calculation
    let openingBalance = 0;
    if (isSingleAccount) {
      openingBalance = await getPriorCumulativeNet(startDate, accountFilter);
    } else {
      const prevBalance = await MonthlyBalance.findOne({ month: prevMonth, year: prevYear });
      openingBalance = prevBalance?.closingBalance || (await getPriorCumulativeNet(startDate, null));
    }
    const closingBalance = openingBalance + netCashFlow;

    // Auto-save snapshot for the global month if not single-account filter
    if (!isSingleAccount) {
      await MonthlyBalance.findOneAndUpdate(
        { month, year },
        { closingBalance, totalInflow, totalOutflow },
        { upsert: true, new: true }
      );
    }

    // 2. Previous month comparison
    const [prevBookingInflows, prevSupplierOutflows, prevManualFlows] = await Promise.all([
      getBookingInflows(prevStart, prevEnd, accountFilter),
      getBookingSupplierOutflows(prevStart, prevEnd, accountFilter),
      getManualFlows(prevStart, prevEnd, accountFilter)
    ]);
    const prevTotalInflow = prevBookingInflows.total + prevManualFlows.manualInflow;
    const prevTotalOutflow = prevSupplierOutflows.total + prevManualFlows.manualOutflow;
    const prevNetCashFlow = prevTotalInflow - prevTotalOutflow;

    const pct = (curr, prev) => (prev === 0 ? null : +(((curr - prev) / prev) * 100).toFixed(1));

    // Category Breakdown (Includes Hotels, Transport, Adventure, Guides, Outsourced, Marketing, Staff Salaries, GST, Others)
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

    // Expense Allocation (Specifically: Staff Salaries, Marketing and Ads, Others, GST)
    const expenseTargetCategories = ['STAFF_SALARIES', 'MARKETING', 'GST', 'OTHERS'];
    const expenseCategoryMap = {
      STAFF_SALARIES: (mergedCategories['STAFF_SALARIES'] || 0) + (mergedCategories['SALARIES'] || 0),
      MARKETING: mergedCategories['MARKETING'] || 0,
      GST: mergedCategories['GST'] || 0,
      OTHERS: mergedCategories['OTHERS'] || 0
    };
    const totalExpenseAllocation = Object.values(expenseCategoryMap).reduce((s, v) => s + v, 0);

    const expenseAllocationBreakdown = expenseTargetCategories
      .map(cat => ({
        category: cat,
        amount: expenseCategoryMap[cat] || 0,
        percentage: totalExpenseAllocation > 0 ? +(((expenseCategoryMap[cat] || 0) / totalExpenseAllocation) * 100).toFixed(1) : 0
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Daily Trend
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const dailyTrend = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const inflow = (bookingInflows.byDay[day] || 0) + (manualFlows.inflowByDay[day] || 0);
      const outflow = (supplierOutflows.byDay[day] || 0) + (manualFlows.outflowByDay[day] || 0);
      return { day, inflow, outflow, net: inflow - outflow };
    });

    // 3. ACCOUNT-WISE BREAKDOWN FOR ALL 6 ACCOUNTS
    // Fetches per-account stats so the main page can always show per-account inflow, outflow, net, and closing
    const [globalBookingInflows, globalSupplierOutflows, globalManualFlows] = await Promise.all([
      getBookingInflows(startDate, endDate, null),
      getBookingSupplierOutflows(startDate, endDate, null),
      getManualFlows(startDate, endDate, null)
    ]);

    const accountWiseBreakdown = await Promise.all(
      SIX_ACCOUNTS.map(async (acc) => {
        const accInflow = (globalBookingInflows.byAccount[acc] || 0) + (globalManualFlows.inflowByAccount[acc] || 0);
        const accOutflow = (globalSupplierOutflows.byAccount[acc] || 0) + (globalManualFlows.outflowByAccount[acc] || 0);
        const accNet = accInflow - accOutflow;
        const priorNet = await getPriorCumulativeNet(startDate, acc);
        const accClosing = priorNet + accNet;

        return {
          account: acc,
          inflow: accInflow,
          outflow: accOutflow,
          net: accNet,
          opening: priorNet,
          closing: accClosing
        };
      })
    );

    res.json({
      month,
      year,
      selectedAccount: accountFilter,
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
      expenseAllocationBreakdown,
      totalExpenseAllocation,
      dailyTrend,
      accountWiseBreakdown
    });
  } catch (err) {
    console.error('getMonthlySummary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getMonthlySummary, getBookingInflows, getBookingSupplierOutflows, getManualFlows, SIX_ACCOUNTS };

