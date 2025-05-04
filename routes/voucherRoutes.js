const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');

router.get('/vouchers/type/:type', voucherController.getVouchersByType);
router.get('/vouchers/buyable/:id', voucherController.getBuyableVoucherById);
router.post('/vouchers/buy', voucherController.buyVoucher);

module.exports = router;