const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// Static routes first
router.get('/rooms', roomController.getRooms);
router.get('/rooms/available', roomController.getAvailableRoom);

// Dynamic routes after static routes
router.get('/rooms/:id', roomController.getRoomById);
router.get('/rooms/:roomId/type', roomController.getRoomTypeByRoomId); // New endpoint
router.get('/rooms/instance/:id', roomController.getRoomNumberById);

module.exports = router;