const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const RoomInstance = require('../models/roomNumber');
const Room = require('../models/room');
const Guest = require('../models/guest');

exports.createTransaction = async (req, res) => {
  try {
    const {
      guest_id,
      room_id,
      voucher_id,
      totalAmount,
      reference_no,
      checkIn,
      checkOut,
      transaction_type,
      basePrice,
      discount
    } = req.body;

    if (!guest_id || !room_id || !totalAmount || !reference_no || !checkIn || !checkOut || !transaction_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!mongoose.isValidObjectId(guest_id)) {
      return res.status(400).json({ success: false, message: 'Invalid guest ID format' });
    }

    const guest = await Guest.findById(guest_id);
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }

    const cleanedReferenceNo = reference_no.replace(/\s/g, '');
    if (!/^\d{13}$/.test(cleanedReferenceNo)) {
      return res.status(400).json({ success: false, message: 'Reference number must be 13 digits' });
    }

    if (!['Booking', 'Reservation'].includes(transaction_type)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    const roomInstance = await RoomInstance.findById(room_id);
    if (!roomInstance) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const roomType = await Room.findById(roomInstance.room_type);
    if (!roomType) {
      return res.status(404).json({ success: false, message: 'Room type not found' });
    }

    const stayHours = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);

    const status = transaction_type === 'Reservation' ? 'reserved' : 'booked';
    const auditAction = status;

    const transaction = new Transaction({
      transaction_type,
      guest_id,
      employee_id: null,
      room_id,
      voucher_id: voucher_id === 'null' ? null : voucher_id,
      payments: [{
        method: 'gcash',
        details: { reference_no: cleanedReferenceNo },
        amount: totalAmount,
        currency: 'PHP',
        status: 'pending',
        processed_at: new Date()
      }],
      stay_details: {
        expected_checkin: new Date(checkIn),
        expected_checkout: new Date(checkOut),
        actual_checkin: null,
        actual_checkout: null,
        guest_num: roomType.guest_num,
        stay_hours: Math.round(stayHours),
        time_allowance: 4
      },
      current_status: 'pending',
      audit_log: [{
        action: auditAction,
        by: guest_id,
        timestamp: new Date(),
        points_earned: 0
      }],
      meta: {
        original_rate: basePrice,
        discount,
        change_given: 0
      }
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      transactionId: transaction._id.toString()
    });
  } catch (error) {
    console.error('Create transaction error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.getTransactionsByGuestId = async (req, res) => {
  try {
    const { guest_id } = req.query;

    if (!guest_id) {
      return res.status(400).json({ success: false, message: 'Guest ID is required' });
    }

    if (!mongoose.isValidObjectId(guest_id)) {
      return res.status(400).json({ success: false, message: 'Invalid guest ID format' });
    }

    const transactions = await Transaction.find({ guest_id }).lean();

    if (!transactions || transactions.length === 0) {
      return res.status(200).json({
        success: true,
        transactions: []
      });
    }

    const formattedTransactions = transactions.map(transaction => {
      // Safely format the transaction object
      const formatted = {
        ...transaction,
        _id: transaction._id?.toString(),
        guest_id: transaction.guest_id?.toString(),
        room_id: transaction.room_id?.toString(),
        voucher_id: transaction.voucher_id ? transaction.voucher_id.toString() : null,
        employee_id: transaction.employee_id ? transaction.employee_id.toString() : null,
        payments: transaction.payments?.map(payment => ({
          ...payment,
          _id: payment._id?.toString(),
          processed_at: payment.processed_at?.getTime?.() || null,
          details: payment.details || {}
        })) || [],
        stay_details: {
          ...transaction.stay_details,
          expected_checkin: transaction.stay_details?.expected_checkin?.getTime?.() || null,
          expected_checkout: transaction.stay_details?.expected_checkout?.getTime?.() || null,
          actual_checkin: transaction.stay_details?.actual_checkin?.getTime?.() || null,
          actual_checkout: transaction.stay_details?.actual_checkout?.getTime?.() || null,
          guest_num: transaction.stay_details?.guest_num || 0,
          stay_hours: transaction.stay_details?.stay_hours || 0,
          time_allowance: transaction.stay_details?.time_allowance || 0
        },
        audit_log: transaction.audit_log?.map(log => ({
          ...log,
          _id: log._id?.toString(),
          by: log.by ? log.by.toString() : 'unknown',
          timestamp: log.timestamp?.getTime?.() || null,
          points_earned: log.points_earned || 0
        })) || [],
        created_at: transaction.created_at?.getTime?.() || null,
        updated_at: transaction.updated_at?.getTime?.() || null
      };

      return formatted;
    });

    res.status(200).json({
      success: true,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error('Get transactions error:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    });
  }
};

exports.getRoomInstanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid room instance ID format' });
    }

    const roomInstance = await RoomInstance.findById(id).lean();

    if (!roomInstance) {
      return res.status(404).json({ success: false, message: 'Room instance not found' });
    }

    res.status(200).json({
      success: true,
      room: {
        _id: roomInstance._id.toString(),
        room_no: roomInstance.room_no,
        room_type: roomInstance.room_type.toString(),
        status: roomInstance.status
      }
    });
  } catch (error) {
    console.error('Get room instance error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { guest_id } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID format' });
    }

    if (!mongoose.isValidObjectId(guest_id)) {
      return res.status(400).json({ success: false, message: 'Invalid guest ID format' });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.guest_id.toString() !== guest_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Guest ID does not match' });
    }

    if (transaction.current_status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction cannot be cancelled' });
    }

    transaction.current_status = 'cancelled';
    transaction.audit_log.push({
      action: 'cancelled',
      by: guest_id,
      timestamp: new Date(),
      points_earned: 0
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction cancelled successfully',
      transactionId: transaction._id.toString()
    });
  } catch (error) {
    console.error('Cancel transaction error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.checkoutTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { guest_id } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID format' });
    }

    if (!mongoose.isValidObjectId(guest_id)) {
      return res.status(400).json({ success: false, message: 'Invalid guest ID format' });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.guest_id.toString() !== guest_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Guest ID does not match' });
    }

    if (transaction.current_status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Transaction cannot be checkout' });
    }

    transaction.current_status = 'completed';
    transaction.audit_log.push({
      action: 'completed',
      by: guest_id,
      timestamp: new Date(),
      points_earned: 0
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction checkout successfully',
      transactionId: transaction._id.toString()
    });
  } catch (error) {
    console.error('Checkout transaction error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID format' });
    }

    const transaction = await Transaction.findById(id).lean();
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Format the transaction similar to getTransactionsByGuestId
    const formattedTransaction = {
      ...transaction,
      _id: transaction._id?.toString(),
      guest_id: transaction.guest_id?.toString(),
      room_id: transaction.room_id?.toString(),
      voucher_id: transaction.voucher_id ? transaction.voucher_id.toString() : null,
      employee_id: transaction.employee_id ? transaction.employee_id.toString() : null,
      payments: transaction.payments?.map(payment => ({
        ...payment,
        _id: payment._id?.toString(),
        processed_at: payment.processed_at?.getTime?.() || null,
        details: payment.details || {}
      })) || [],
      stay_details: {
        ...transaction.stay_details,
        expected_checkin: transaction.stay_details?.expected_checkin?.getTime?.() || null,
        expected_checkout: transaction.stay_details?.expected_checkout?.getTime?.() || null,
        actual_checkin: transaction.stay_details?.actual_checkin?.getTime?.() || null,
        actual_checkout: transaction.stay_details?.actual_checkout?.getTime?.() || null,
        guest_num: transaction.stay_details?.guest_num || 0,
        stay_hours: transaction.stay_details?.stay_hours || 0,
        time_allowance: transaction.stay_details?.time_allowance || 0
      },
      audit_log: transaction.audit_log?.map(log => ({
        ...log,
        _id: log._id?.toString(),
        by: log.by ? log.by.toString() : 'unknown',
        timestamp: log.timestamp?.getTime?.() || null,
        points_earned: log.points_earned || 0
      })) || [],
      created_at: transaction.created_at?.getTime?.() || null,
      updated_at: transaction.updated_at?.getTime?.() || null
    };

    res.status(200).json({
      success: true,
      transaction: formattedTransaction
    });
  } catch (error) {
    console.error('Get transaction error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
};