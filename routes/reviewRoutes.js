const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.post('/reviews', reviewController.addReview);
router.get('/reviews/room/:room_type', reviewController.getReviewsByRoomType);
router.get('/reviews/stats/:room_type', reviewController.getRatingStatsByRoomType);
router.get('/reviews/top-room', reviewController.getTopRoom);

module.exports = router;