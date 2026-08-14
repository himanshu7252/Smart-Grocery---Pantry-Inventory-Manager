const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/:id/read')
  .put(markNotificationRead);

module.exports = router;
