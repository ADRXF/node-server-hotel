const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const Guest = require('../models/guest');
const Membership = require('../models/membership');
const Voucher = require('../models/voucher');

// Verify Voucher model import
if (!Voucher) {
  console.error('Voucher model is not defined');
  process.exit(1);
}

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Existing user found:', existingUser);
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    console.log('No existing user found for email:', email);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 4-digit OTP
    const otp = crypto.randomInt(1000, 9999).toString(); // Generates 4-digit number (1000–9999)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      otp,
      otpExpires,
    });

    // Save user to database
    await user.save();
    console.log('User saved to MongoDB:', { firstName, lastName, email, otp });

    // Send OTP email
    const transporter = req.app.get('transporter');
    if (!transporter) {
      console.error('Transporter not found');
      return res.status(500).json({ success: false, message: 'Email service unavailable' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP email sent to:', email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully, OTP sent to email',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        address: user.address,
        mobileNumber: user.mobileNumber,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check OTP and expiration
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Update user
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        address: user.address,
        mobileNumber: user.mobileNumber,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate new OTP
    const otp = crypto.randomInt(1000, 9999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // Update user
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const transporter = req.app.get('transporter');
    if (!transporter) {
      console.error('Transporter not found');
      return res.status(500).json({ success: false, message: 'Email service unavailable' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'OTP Verification',
      text: `Your new OTP code is ${otp}. It expires in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP email sent to:', email);

    res.json({
      success: true,
      message: 'OTP resent successfully',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        address: user.address,
        mobileNumber: user.mobileNumber,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check OTP and expiration
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        email: user.email
      }
    });
  } catch (error) {
    console.error('Reset OTP verification error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Validate input
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log('Password reset for user:', { email });

    res.json({
      success: true,
      message: 'Password reset successfully',
      user: {
        email: user.email
      }
    });
  } catch (error) {
    console.error('Reset password error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.getUserData = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('firstName lastName email gender address mobileNumber profilePic');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        address: user.address,
        mobileNumber: user.mobileNumber,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Get user data error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.completeProfile = async (req, res) => {
  try {
    const { email, gender, address, mobileNumber, profilePic } = req.body;

    if (!email || !gender || !address || !mobileNumber) {
      return res.status(400).json({ success: false, message: 'Email, gender, address, and mobile number are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user fields
    user.gender = gender;
    user.address = address;
    user.mobileNumber = mobileNumber;
    user.profilePic = profilePic

    await user.save();
    console.log('User profile updated:', { email, gender, address, mobileNumber });

    // Check if guest already exists
    const existingGuest = await Guest.findOne({ user_id: user._id });
    if (existingGuest) {
      console.log('Guest already exists for user:', user._id);
    } else {
      // Create guest document
      const guest = new Guest({
        user_id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        address: user.address,
        mobileNumber: user.mobileNumber,
        membership_id: '680633168dad09b53e4ed6c8',
        user_vouchers: [{
          voucher_id: '6806399f8dad09b53e4ed6d6',
          status: 'unused',
          date_claimed: null,
          date_expired: null
        }],
        points: 300,
        checkin_count: 0
      });

      await guest.save();
      console.log('Guest created:', { user_id: user._id, email });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        address: user.address,
        mobileNumber: user.mobileNumber,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found' });
    }

    // Check if account is deactivated
    if (user.status === 'deactivated') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    // Check verification status
    if (!user.isVerified) {
      // Generate new OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
      const otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

      // Update user with new OTP
      await User.updateOne(
        { _id: user._id },
        { $set: { otp, otpExpires } }
      );

      // Send OTP email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Account Verification',
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`
      };

      await transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}: ${otp}`);

      return res.status(403).json({ success: false, message: 'Account not verified', requiresOtp: true });
    }

    // Check profile completion
    const guest = await Guest.findOne({ user_id: user._id });
    const profileCompleted = !!guest;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'JWT_SECRET',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      userId: user._id.toString(),
      firstName: user.firstName,
      email: user.email,
      profileCompleted
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.checkToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const guest = await Guest.findOne({ user_id: user._id });
    res.status(200).json({
      success: true,
      userId: user._id.toString(),
      firstName: user.firstName,
      email: user.email,
      profileCompleted: !!guest
    });
  } catch (error) {
    console.error('Check token error:', error.message, error.stack);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find guest
    const guest = await Guest.findOne({ user_id: user._id });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest profile not found',
      });
    }

    // Debug: Log raw guest
    console.log('Raw Guest:', {
      email: guest.email,
      user_id: guest.user_id.toString(),
      membership_id: guest.membership_id ? guest.membership_id.toString() : 'null'
    });

    // Populate membership_id
    const populatedGuest = await Guest.findOne({ user_id: user._id }).populate('membership_id');

    // Debug: Log populated guest
    console.log('Populated Guest:', {
      email: populatedGuest.email,
      user_id: populatedGuest.user_id.toString(),
      membership_id: populatedGuest.membership_id ? populatedGuest.membership_id.toString() : 'null',
      membership_name: populatedGuest.membership_id ? populatedGuest.membership_id.membership_name : 'null'
    });

    // Use fallback if membership_id is not populated
    const membershipName = populatedGuest.membership_id
      ? populatedGuest.membership_id.membership_name
      : 'Explorer';

    res.status(200).json({
      success: true,
      message: 'Profile data retrieved successfully',
      user: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: user.email,
        gender: user.gender,
        address: user.address,
        mobileNumber: user.mobileNumber,
        profilePic: user.profilePic || 'default_profile',
        membershipName
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
      const { email, profilePic } = req.query;

      // Validate input
      if (!email || !profilePic) {
          return res.status(400).json({
              success: false,
              message: 'Email and profile picture are required',
          });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found',
          });
      }

      // Optional: Validate profilePic
      const validProfilePics = [
          'default_profile',
          'girl1_kim',
          'girl2_pancho',
          'girl3_leamord',
          'boy1_panot',
          'boy2_ivan',
          'boy3_peter',
      ];
      if (!validProfilePics.includes(profilePic)) {
          return res.status(400).json({
              success: false,
              message: 'Invalid profile picture',
          });
      }

      // Update profile picture
      user.profilePic = profilePic;
      await user.save();

      // Log the update for auditing (optional)
      console.log(`Profile picture updated for email: ${email}, new profilePic: ${profilePic}`);

      res.status(200).json({
          success: true,
          message: 'Profile picture updated successfully',
      });
  } catch (error) {
      console.error('Update profile picture error:', error.message, error.stack);
      res.status(500).json({
          success: false,
          message: `Server error: ${error.message}`,
      });
  }
};

exports.updateContactInfo = async (req, res) => {
  try {
      const { email, address, mobileNumber } = req.body;

      // Validate input
      if (!email) {
          return res.status(400).json({
              success: false,
              message: 'Email is required',
          });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found',
          });
      }

      // Update user fields if provided
      if (address !== null) user.address = address;
      if (mobileNumber !== null) {
          // Optional: Validate mobileNumber format
          if (mobileNumber && !/^\d{10,15}$/.test(mobileNumber)) {
              return res.status(400).json({
                  success: false,
                  message: 'Invalid mobile number format (10-15 digits required)',
              });
          }
          user.mobileNumber = mobileNumber;
      }
      await user.save();

      // Find and update guest
      const guest = await Guest.findOne({ user_id: user._id });
      if (!guest) {
          return res.status(404).json({
              success: false,
              message: 'Guest profile not found',
          });
      }

      // Update guest fields if provided
      if (address !== null) guest.address = address;
      if (mobileNumber !== null) guest.mobileNumber = mobileNumber;
      await guest.save();

      // Log the update for auditing
      console.log(`Contact info updated for email: ${email}, address: ${address}, mobileNumber: ${mobileNumber}`);

      res.status(200).json({
          success: true,
          message: 'Contact information updated successfully',
      });
  } catch (error) {
      console.error('Update contact info error:', error.message, error.stack);
      res.status(500).json({
          success: false,
          message: `Server error: ${error.message}`,
      });
  }
};

exports.getUserVouchers = async (req, res) => {
  try {
    const { email } = req.params;

    // Validate input
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find guest by email
    const guest = await Guest.findOne({ email });
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest profile not found' });
    }

    // Filter user_vouchers for status not "used"
    const validVouchers = guest.user_vouchers.filter(v => v.status !== 'used');

    // Extract voucher IDs
    const voucherIds = validVouchers.map(v => v.voucher_id);

    // Fetch vouchers from vouchers collection, ensuring they are not expired
    const currentDate = new Date();
    const vouchers = await Voucher.find({
      _id: { $in: voucherIds },
      valid_until: { $gte: currentDate },
      is_active: true
    });

    // Map vouchers to the expected response format
    const formattedVouchers = vouchers.map(voucher => ({
      id: voucher._id.toString(),
      name: voucher.name,
      description: voucher.description,
      expirationDate: voucher.valid_until.toISOString(),
      value: voucher.value,
      valueType: voucher.value_type
    }));

    res.status(200).json({
      success: true,
      message: 'Vouchers retrieved successfully',
      vouchers: formattedVouchers
    });
  } catch (error) {
    console.error('Get user vouchers error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    // Validate input
    if (!id) {
      return res.status(400).json({ success: false, message: 'Voucher ID is required' });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find guest by email
    const guest = await Guest.findOne({ email });
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest profile not found' });
    }

    // Check if voucher is in user's user_vouchers and not used
    const userVoucher = guest.user_vouchers.find(v => v.voucher_id.toString() === id && v.status !== 'used');
    if (!userVoucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found or already used' });
    }

    // Fetch voucher from vouchers collection
    const currentDate = new Date();
    const voucher = await Voucher.findOne({
      _id: id,
      valid_until: { $gte: currentDate },
      is_active: true
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found or expired' });
    }

    // Format response
    const formattedVoucher = {
      id: voucher._id.toString(),
      name: voucher.name,
      description: voucher.description,
      expirationDate: voucher.valid_until.toISOString(),
      value: voucher.value,
      valueType: voucher.value_type
    };

    res.status(200).json({
      success: true,
      message: 'Voucher retrieved successfully',
      voucher: formattedVoucher
    });
  } catch (error) {
    console.error('Get voucher by ID error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    // Validate input
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, old password, and new password are required' });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect old password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log('Password changed for user:', { email });

    res.json({
      success: true,
      message: 'Password changed successfully',
      user: {
        email: user.email
      }
    });
  } catch (error) {
    console.error('Change password error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    const { email, password, deactivateReason } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Check if account is already deactivated
    if (user.status === 'deactivated') {
      return res.status(400).json({ success: false, message: 'Account is already deactivated' });
    }

    // Update status to deactivated
    user.status = 'deactivated';
    await user.save();

    console.log('Account deactivated for user:', { email, deactivateReason });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};