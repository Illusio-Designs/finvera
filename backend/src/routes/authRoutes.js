const { Router } = require('express');
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

// Profile routes (require authentication)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/profile/image', authenticate, uploadProfile.single('profile_image'), authController.uploadProfileImage);

module.exports = router;


