const mongoose = require('mongoose');
const Review = require('../models/review');

exports.addReview = async (req, res) => {
  try {
    const { rate, room_type, guest_id, comment } = req.body;

    // Validate input
    if (!rate || !room_type || !guest_id || !comment) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (rate < 1 || rate > 5) {
      return res.status(400).json({ success: false, message: 'Rate must be between 1 and 5' });
    }

    if (comment.length > 200) {
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 200 characters' });
    }

    // Create new review
    const review = new Review({
      rate,
      room_type,
      guest_id,
      comment,
      status: 'published'
    });

    await review.save();

    res.status(201).json({ success: true, message: 'Review added successfully', review });
  } catch (error) {
    console.error('Error adding review:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getReviewsByRoomType = async (req, res) => {
  try {
    const { room_type } = req.params;

    // Fetch reviews where room_type matches and status is published
    const reviews = await Review.find({ 
      room_type, 
      status: 'published' 
    })
      .select('rate comment created_at')
      .lean();

    if (!reviews.length) {
      return res.status(200).json({ success: true, reviews: [], message: 'No reviews found' });
    }

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRatingStatsByRoomType = async (req, res) => {
  try {
    const { room_type } = req.params;

    // Log the input room_type
    console.log(`Fetching stats for room_type: ${room_type}`);

    // Fetch matching reviews for debugging
    const matchedReviews = await Review.find({ 
      room_type, 
      status: 'published' 
    }).lean();
    console.log(`Matched reviews: ${JSON.stringify(matchedReviews)}`);

    // Aggregate reviews to calculate average rating and count
    const stats = await Review.aggregate([
      // Convert room_type string to ObjectId
      {
        $match: {
          room_type: mongoose.Types.ObjectId.createFromHexString(room_type),
          status: 'published'
        }
      },
      {
        $group: {
          _id: null,
          reviewCount: { $sum: 1 },
          averageRating: { $avg: '$rate' }
        }
      }
    ]);

    console.log(`Aggregation result: ${JSON.stringify(stats)}`);

    if (!stats.length) {
      return res.status(200).json({
        success: true,
        reviewCount: 0,
        averageRating: 0.0
      });
    }

    const { reviewCount, averageRating } = stats[0];
    res.status(200).json({
      success: true,
      reviewCount,
      averageRating: parseFloat(averageRating.toFixed(1))
    });
  } catch (error) {
    console.error('Error fetching rating stats:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};