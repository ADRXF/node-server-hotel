const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transaction_type: {
    type: String,
    required: true,
    enum: ['Reservation', 'Booking']
  },
  guest_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: true
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomInstance',
    required: true
  },
  voucher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  payments: [{
    method: {
      type: String,
      required: true
    },
    details: {
      reference_no: String
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    processed_at: {
      type: Date,
      required: true
    }
  }],
  stay_details: {
    expected_checkin: {
      type: Date,
      required: true
    },
    expected_checkout: {
      type: Date,
      required: true
    },
    actual_checkin: {
      type: Date
    },
    actual_checkout: {
      type: Date
    },
    guest_num: {
      type: Number,
      required: true
    },
    stay_hours: {
      type: Number,
      required: true
    },
    time_allowance: {
      type: Number
    }
  },
  current_status: {
    type: String,
    required: true,
    enum: ['pending', 'reserved', 'confirmed', 'booked', 'cancelled', 'completed']
  },
  audit_log: [{
    action: {
      type: String,
      required: true
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest' // Changed from 'User' to 'Guest'
    },
    timestamp: {
      type: Date,
      required: true
    },
    points_earned: {
      type: Number,
      default: 0
    }
  }],
  meta: {
    original_rate: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      required: true
    },
    change_given: {
      type: Number,
      required: true
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'transactions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Transaction', transactionSchema);