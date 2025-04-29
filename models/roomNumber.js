const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  room_no: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  room_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  }
}, {
  collection: 'rooms'
});

module.exports = mongoose.model('RoomInstance', roomSchema);