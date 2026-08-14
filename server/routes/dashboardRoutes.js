const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getDashboardAnalytics,
  getRestockPredictions
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/analytics', getDashboardAnalytics);
router.get('/restock-predictions', getRestockPredictions);

module.exports = router;
