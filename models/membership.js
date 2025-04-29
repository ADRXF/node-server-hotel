const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
    membership_name: {
        type: String,
        required: true
    },
    membership_level: {
        type: Number,
        required: true
    },
    check_in_threshold: {
        type: Number,
        required: true
    },
    check_in_points: {
        type: Number,
        required: true
    },
    booking_points: {
        type: Number,
        required: true
    },
    reservation_points: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'membership' });

module.exports = mongoose.model('Membership', membershipSchema);