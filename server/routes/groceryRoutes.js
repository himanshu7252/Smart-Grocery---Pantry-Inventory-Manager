const express = require('express');
const router = express.Router();
const {
  getGroceries,
  getGroceryById,
  createGrocery,
  updateGrocery,
  deleteGrocery,
  consumeGrocery,
  purchaseGrocery,
  getGroceryHistory
} = require('../controllers/groceryController');
const { protect } = require('../middleware/authMiddleware');

// Secure all routes with auth protect
router.use(protect);

router.route('/')
  .get(getGroceries)
  .post(createGrocery);

router.route('/:id')
  .get(getGroceryById)
  .put(updateGrocery)
  .delete(deleteGrocery);

router.post('/:id/consume', consumeGrocery);
router.post('/:id/purchase', purchaseGrocery);
router.get('/:id/history', getGroceryHistory);

module.exports = router;
