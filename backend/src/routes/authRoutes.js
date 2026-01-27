const { Router } = require('express');
const passport = require('passport');
const validator = require('../middleware/validator');
const { loginValidator, registerValidator } = require('../validators/authValidator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { uploadProfile } = require('../config/multer');

const router = Router();

router.post('/register', validator(registerValidator), authController.register);
router.post('/login', validator(loginValidator), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/switch-company', authenticate, authController.switchCompany);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);

// Profile routes (require authentication)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/profile/image', authenticate, (req, res, next) => {
  console.log('Profile image upload request received');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  next();
}, uploadProfile.any(), (req, res, next) => {
  console.log('Files received:', req.files);
  console.log('Body received:', req.body);
  
  // Find the image file (mobile app sends fieldname: 'image')
  const imageFile = req.files?.find(file => file.fieldname === 'image');
  if (imageFile) {
    req.file = imageFile;
    console.log('✅ Found image file:', {
      fieldname: imageFile.fieldname,
      filename: imageFile.filename,
      size: imageFile.size
    });
  } else {
    console.log('❌ No image file found in req.files');
  }
  
  next();
}, authController.uploadProfileImage);
router.post('/change-password', authenticate, authController.changePassword);

// Password reset routes (no authentication required)
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router;


