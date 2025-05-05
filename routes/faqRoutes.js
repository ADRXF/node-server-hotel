const express = require('express');
const router = express.Router();
const FAQ = require('../models/faq');

// Get all FAQs or filter by category
router.get('/faqs', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const faqs = await FAQ.find(query).sort({ created_at: -1 });
    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all unique categories
router.get('/faqs/categories', async (req, res) => {
  try {
    const categories = await FAQ.distinct('category');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching FAQ categories:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;