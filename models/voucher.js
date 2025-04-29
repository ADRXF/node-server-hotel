const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  value_type: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  membership_required: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership'
  },
  valid_from: {
    type: Date,
    required: true
  },
  valid_until: {
    type: Date,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);