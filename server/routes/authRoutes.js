const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  createFamily,
  joinFamily,
  getFamilyDetails
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Family Group Sharing Endpoints
router.post('/family/create', protect, createFamily);
router.post('/family/join', protect, joinFamily);
router.get('/family/:familyId', protect, getFamilyDetails);

module.exports = router;
