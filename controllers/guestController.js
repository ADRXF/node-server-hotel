const Guest = require('../models/guest');

exports.getGuestProfile = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const guest = await Guest.findOne({ email });
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }

    res.status(200).json({
      success: true,
      guest: {
        _id: guest._id.toString(),
        user_id: guest.user_id.toString(),
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        gender: guest.gender,
        address: guest.address,
        mobileNumber: guest.mobileNumber,
        membership_id: guest.membership_id.toString(),
        points: guest.points,
        checkin_count: guest.checkin_count
      }
    });
  } catch (error) {
    console.error('Get guest profile error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};