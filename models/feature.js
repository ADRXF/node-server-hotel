const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  feature_name: {
    type: String,
    required: true,
    trim: true
  },
  feature_icon: {
    type: String,
    default: ''
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
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Feature', featureSchema, 'features');