const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  address: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    default: '',
  },
  mobileNumber: {
    type: String,
    default: '',
  },
  profilePic: {
    type: String,
    default: 'default_profile',
  },
  status: {
    type: String,
    default: 'active',
  },
  role: {
    type: String,
    default: 'guest',
  },
});

module.exports = mongoose.model('User', userSchema);