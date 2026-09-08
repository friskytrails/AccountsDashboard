const mongoose = require('mongoose');

const MonthlyBalanceSchema = new mongoose.Schema({
  month: { type: Number, required: true },    // 1–12
  year: { type: Number, required: true },      // e.g. 2026
  openingBalance: { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
  totalInflow: { type: Number, default: 0 },
  totalOutflow: { type: Number, default: 0 },
  isManuallySet: { type: Boolean, default: false }
}, { timestamps: true });

MonthlyBalanceSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyBalance', MonthlyBalanceSchema, 'monthly_balances');
