const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  gender: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  mobileNumber: {
    type: String,
    default: ''
  },
  membership_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    required: true,
    default: '680633168dad09b53e4ed6c8'
  },
  user_vouchers: [{
    voucher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      required: true
    },
    status: {
      type: String,
      enum: ['unused', 'used', 'expired'],
      default: 'unused'
    },
    date_claimed: {
      type: Date,
      default: null
    },
    date_expired: {
      type: Date,
      default: null
    }
  }],
  points: {
    type: Number,
    default: 300
  },
  checkin_count: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Guest', guestSchema);