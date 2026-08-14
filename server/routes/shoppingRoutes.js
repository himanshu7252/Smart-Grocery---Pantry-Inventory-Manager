const express = require('express');
const router = express.Router();
const {
  getShoppingList,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem
} = require('../controllers/shoppingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getShoppingList);

router.route('/items')
  .post(addShoppingItem);

router.route('/items/:itemId')
  .put(updateShoppingItem)
  .delete(deleteShoppingItem);

module.exports = router;
