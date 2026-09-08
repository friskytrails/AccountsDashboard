const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['INFLOW', 'OUTFLOW'],
    required: true
  },
  category: {
    type: String,
    enum: ['HOTELS', 'TRANSPORT', 'GUIDES', 'SIGHTSEEING', 'SALARIES', 'MARKETING', 'OTHERS'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  paymentMode: {
    type: String,
    enum: ['UPI', 'BANK_TRANSFER', 'CASH', 'CARD', 'CHEQUE', 'OTHER'],
    default: 'BANK_TRANSFER'
  },
  referenceNumber: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: false
  },
  addedByName: {
    type: String,
    default: 'Finance Team'
  }
}, { timestamps: true });

// Index for fast month-wise queries
TransactionSchema.index({ date: 1 });
TransactionSchema.index({ type: 1, date: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema, 'transactions');
