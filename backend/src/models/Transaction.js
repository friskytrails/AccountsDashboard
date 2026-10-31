const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['INFLOW', 'OUTFLOW'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'STAFF_SALARIES', 'MARKETING', 'OTHERS', 'GST',
      'SALARIES', 'SUPPLIERS', 'OPERATIONS', 'HOTELS', 'TRANSPORT', 'GUIDES', 'SIGHTSEEING', 'ADVENTURE',
      'TRAVELLER_TO_COMPANY', 'SUPPLIER_TO_COMPANY', 'COMPANY_TO_SUPPLIER', 'COMPANY_TO_TRAVELLER'
    ],
    required: true
  },
  flowDirection: {
    type: String,
    enum: [
      'TRAVELLER_TO_COMPANY',
      'SUPPLIER_TO_COMPANY',
      'COMPANY_TO_SUPPLIER',
      'COMPANY_TO_TRAVELLER'
    ],
    default: 'TRAVELLER_TO_COMPANY'
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
    enum: [
      'Kalpana BOI',
      'Kalpana PNB',
      'Babita AU',
      'Hari Mohan BOB',
      'FT HDFC',
      'Pratyush SBI'
    ],
    default: 'Kalpana BOI',
    required: true
  },
  referenceNumber: {
    type: String,
    trim: true,
    default: ''
  },
  screenshot: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.Mixed,
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
