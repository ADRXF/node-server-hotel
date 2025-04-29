const Room = require('../models/room');
const RoomInstance = require('../models/roomNumber');
const Transaction = require('../models/transaction');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'active' })
      .populate({
        path: 'room_features',
        match: { status: 'active' },
        select: 'feature_name'
      })
      .lean();

    if (!rooms || rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active rooms found'
      });
    }

    console.log('Fetched rooms from DB:', rooms);

    const formattedRooms = rooms.map(room => {
      console.log('Raw room_features for room', room._id, ':', room.room_features);
      const amenities = {
        bedType: 'Double',
        wifi: false,
        tv: false
      };

      const features = room.room_features
        ? room.room_features.map(feature => feature.feature_name)
        : [];

      if (room.room_features) {
        room.room_features.forEach(feature => {
          const name = feature.feature_name.toLowerCase();
          if (name.includes('bed')) {
            amenities.bedType = feature.feature_name;
          } else if (name.includes('wi-fi') || name.includes('internet')) {
            amenities.wifi = true;
          } else if (name.includes('tv') || name.includes('television')) {
            amenities.tv = true;
          }
        });
      }

      return {
        _id: room._id.toString(),
        name: room.type_name,
        description: room.description,
        overview: room.description,
        pricePer12Hours: room.rates.checkin_12h,
        capacity: room.guest_num,
        rating: 0.0,
        reviewCount: 0,
        isAvailable: room.status === 'active',
        amenities,
        rates: {
          checkin_12h: room.rates.checkin_12h,
          checkin_24h: room.rates.checkin_24h,
          reservation_12h: room.rates.reservation_12h,
          reservation_24h: room.rates.reservation_24h
        },
        features
      };
    });

    console.log('Formatted rooms:', formattedRooms);

    res.status(200).json({
      success: true,
      message: 'Rooms fetched successfully',
      rooms: formattedRooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rooms',
      error: error.message
    });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findOne({ _id: id, status: 'active' })
      .populate({
        path: 'room_features',
        match: { status: 'active' },
        select: 'feature_name'
      })
      .lean();

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or inactive'
      });
    }

    console.log('Fetched room from DB:', room);
    console.log('Raw room_features for room', room._id, ':', room.room_features);

    const amenities = {
      bedType: 'Double',
      wifi: false,
      tv: false
    };

    const features = room.room_features
      ? room.room_features.map(feature => feature.feature_name)
      : [];

    if (room.room_features) {
      room.room_features.forEach(feature => {
        const name = feature.feature_name.toLowerCase();
        if (name.includes('bed')) {
          amenities.bedType = feature.feature_name;
        } else if (name.includes('wi-fi') || name.includes('internet')) {
          amenities.wifi = true;
        } else if (name.includes('tv') || name.includes('television')) {
          amenities.tv = true;
        }
      });
    }

    const formattedRoom = {
      _id: room._id.toString(),
      name: room.type_name,
      description: room.description,
      overview: '',
      pricePer12Hours: room.rates.checkin_12h,
      capacity: room.guest_num,
      rating: 0.0,
      reviewCount: 0,
      isAvailable: room.status === 'active',
      amenities,
      rates: {
        checkin_12h: room.rates.checkin_12h,
        checkin_24h: room.rates.checkin_24h,
        reservation_12h: room.rates.reservation_12h,
        reservation_24h: room.rates.reservation_24h
      },
      features
    };

    console.log('Formatted room:', formattedRoom);

    res.status(200).json({
      success: true,
      message: 'Room fetched successfully',
      room: formattedRoom
    });
  } catch (error) {
    console.error('Error fetching room:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching room',
      error: error.message
    });
  }
};

exports.getAvailableRoom = async (req, res) => {
  try {
    const { roomTypeId, checkIn, checkOut } = req.query;
    console.log('getAvailableRoom called with:', { roomTypeId, checkIn, checkOut });

    if (!roomTypeId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'roomTypeId, checkIn, and checkOut are required'
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate) || isNaN(checkOutDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid checkIn or checkOut date format'
      });
    }

    console.log('Querying RoomInstance for room_type:', roomTypeId);
    const rooms = await RoomInstance.find({ room_type: roomTypeId }).lean();
    console.log('Found rooms:', rooms);

    if (!rooms || rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No rooms found for the specified room type'
      });
    }

    for (const room of rooms) {
      console.log('Checking transactions for room:', room._id);
      const transactions = await Transaction.find({
        room_id: room._id,
        $or: [
          { 'stay_details.expected_checkin': { $lt: checkOutDate } },
          { 'stay_details.expected_checkout': { $gt: checkInDate } }
        ]
      }).lean();
      console.log('Transactions for room:', transactions);

      const hasConflict = transactions.some(transaction => {
        const transCheckIn = new Date(transaction.stay_details.expected_checkin);
        const transCheckOut = new Date(transaction.stay_details.expected_checkout);
        return checkInDate < transCheckOut && checkOutDate > transCheckIn;
      });

      if (!hasConflict) {
        return res.status(200).json({
          success: true,
          message: 'Available room found',
          room: {
            _id: room._id.toString(),
            room_no: room.room_no
          }
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: 'No available rooms for the specified dates'
    });
  } catch (error) {
    console.error('Error finding available room:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while finding available room',
      error: error.message
    });
  }
};

exports.getRoomTypeByRoomId = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    
    // Find room instance by ID
    const roomInstance = await RoomInstance.findById(roomId).populate('room_type');
    if (!roomInstance) {
      return res.status(404).json({ success: false, message: 'Room instance not found' });
    }
    
    // Room type is populated from Room model
    const roomType = roomInstance.room_type;
    if (!roomType) {
      return res.status(404).json({ success: false, message: 'Room type not found' });
    }
    
    // Return only required room type details
    res.status(200).json({
      success: true,
      data: {
        _id: roomType._id,
        name: roomType.type_name,
        guest_num: roomType.guest_num,
        rate: roomType.rates.checkin_12h
      }
    });
  } catch (error) {
    console.error('Error fetching room type:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};