const { Router } = require('express');
const validator = require('../middleware/validator');
const { loginValidator, registerValidator } = require('../validators/authValidator');
const authController = require('../controllers/authController');

const router = Router();

router.post('/register', validator(registerValidator), authController.register);
router.post('/login', validator(loginValidator), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

module.exports = router;


