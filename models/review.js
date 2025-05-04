const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  room_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType',
    required: true
  },
  guest_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: true
  },
  comment: {
    type: String,
    required: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['published', 'pending', 'archived'],
    default: 'published'
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
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Review', reviewSchema);