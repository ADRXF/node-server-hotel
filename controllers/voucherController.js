const Voucher = require('../models/voucher');
const Guest = require('../models/guest');

exports.getVouchersByType = async (req, res) => {
    try {
      const { type } = req.params;
      const { email } = req.query;
  
      // Validate input
      if (!type) {
        return res.status(400).json({ success: false, message: 'Type is required' });
      }
  
      // Fetch vouchers from vouchers collection where type matches and is active/not expired
      const currentDate = new Date();
      const vouchers = await Voucher.find({
        type: type,
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
        valueType: voucher.value_type,
        price: voucher.price 
      }));
  
      res.status(200).json({
        success: true,
        message: `Vouchers with type ${type} retrieved successfully`,
        vouchers: formattedVouchers
      });
    } catch (error) {
      console.error('Get vouchers by type error:', error.message, error.stack);
      res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
  };

  exports.getBuyableVoucherById = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Validate input
      if (!id) {
        return res.status(400).json({ success: false, message: 'Voucher ID is required' });
      }
  
      // Fetch voucher from vouchers collection
      const currentDate = new Date();
      const voucher = await Voucher.findOne({
        _id: id,
        type: 'buyable',
        valid_until: { $gte: currentDate },
        is_active: true
      });
  
      if (!voucher) {
        return res.status(404).json({ success: false, message: 'Buyable voucher not found or expired' });
      }
  
      // Format response
      const formattedVoucher = {
        id: voucher._id.toString(),
        name: voucher.name,
        description: voucher.description,
        expirationDate: voucher.valid_until.toISOString(),
        value: voucher.value,
        valueType: voucher.value_type,
        price: voucher.price // Include price field
      };
      
      res.status(200).json({
        success: true,
        message: 'Buyable voucher retrieved successfully',
        voucher: formattedVoucher
      });
    } catch (error) {
      console.error('Get buyable voucher by ID error:', error.message, error.stack);
      res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
  };

  exports.buyVoucher = async (req, res) => {
    try {
      const { email, voucherId } = req.body;
  
      // Validate input
      if (!email || !voucherId) {
        return res.status(400).json({ success: false, message: 'Email and voucher ID are required' });
      }
  
      // Find guest by email
      const guest = await Guest.findOne({ email });
      if (!guest) {
        return res.status(404).json({ success: false, message: 'Guest profile not found' });
      }
  
      // Find voucher by ID
      const currentDate = new Date();
      const voucher = await Voucher.findOne({
        _id: voucherId,
        type: 'buyable',
        valid_until: { $gte: currentDate },
        is_active: true
      });
      if (!voucher) {
        return res.status(404).json({ success: false, message: 'Buyable voucher not found or expired' });
      }
  
      // Check if user has enough points
      if (guest.points < voucher.price) {
        return res.status(400).json({ success: false, message: 'Not enough points to purchase this voucher' });
      }
  
      // Deduct points
      guest.points -= voucher.price;
  
      // Add voucher to user_vouchers
      guest.user_vouchers.push({
        voucher_id: voucherId,
        status: 'unused',
        date_claimed: new Date(),
        date_expired: voucher.valid_until
      });
  
      // Save guest changes
      await guest.save();
  
      res.status(200).json({
        success: true,
        message: 'Voucher purchased successfully',
        updatedPoints: guest.points
      });
    } catch (error) {
      console.error('Buy voucher error:', error.message, error.stack);
      res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
  };