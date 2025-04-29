const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.post('/transactions', transactionController.createTransaction);
router.get('/transactions', transactionController.getTransactionsByGuestId);
router.get('/room_instances/:id', transactionController.getRoomInstanceById);

router.put('/transactions/:id/cancel', transactionController.cancelTransaction);


module.exports = router;