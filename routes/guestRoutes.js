const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');

router.get('/guests/profile', guestController.getGuestProfile);

module.exports = router;