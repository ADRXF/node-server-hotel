const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);
router.get('/user/:email', userController.getUserData);
router.post('/complete-profile', userController.completeProfile);
router.post('/login', userController.loginUser);
router.get('/check-token', userController.checkToken);
router.get('/users/profile', userController.getUserProfile);
router.put('/auth/update-profile-pic', userController.updateProfilePicture);
router.post('/auth/update-contact', userController.updateContactInfo);
router.get('/vouchers/:email', userController.getUserVouchers);
router.get('/vouchers/id/:id', userController.getVoucherById);
router.post('/verify-reset-otp', userController.verifyResetOtp);
router.post('/reset-password', userController.resetPassword);
router.post('/auth/change-password', userController.changePassword);

module.exports = router;