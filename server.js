require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const guestRoutes = require('./routes/guestRoutes');

// Import models to ensure registration
require('./models/feature');
require('./models/room');
require('./models/user');
require('./models/membership');
require('./models/roomNumber');
require('./models/transaction');
require('./models/voucher');
require('./models/guest');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Nodemailer configuration
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('Nodemailer transporter created successfully');
} catch (error) {
  console.error('Failed to create Nodemailer transporter:', error.message);
  process.exit(1); // Exit if email setup fails
}

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('Transporter verification failed:', error.message);
    process.exit(1);
  } else {
    console.log('Transporter verified: Ready to send emails');
  }
});

// Make transporter available to routes
app.set('transporter', transporter);

// Routes
app.use('/api', userRoutes);
app.use('/api', roomRoutes);
app.use('/api', transactionRoutes);
app.use('/api', guestRoutes);


// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas Connected'))
  .catch(err => {
    console.error('MongoDB Atlas Connection Error:', err.message);
    process.exit(1);
  });

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));