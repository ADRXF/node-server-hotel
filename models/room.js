const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  type_name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  guest_num: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  rates: {
    checkin_12h: { type: Number, required: true },
    checkin_24h: { type: Number, required: true },
    reservation_12h: { type: Number, required: true },
    reservation_24h: { type: Number, required: true }
  },
  images: {
    type: [String],
    default: []
  },
  room_features: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feature'
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Room', roomSchema, 'room_types');