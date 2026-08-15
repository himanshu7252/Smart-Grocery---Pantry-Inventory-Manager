const ShoppingList = require('../models/ShoppingList.js');
const Grocery = require('../models/Grocery.js');
const Transaction = require('../models/Transaction.js');

// @desc    Get active shopping list for user
// @route   GET /api/shopping-lists
// @access  Private
const getShoppingList = async (req, res) => {
  try {
    let shoppingList = await ShoppingList.findOne({
      userId: req.user._id,
      status: 'active'
    });

    if (!shoppingList) {
      // Auto-create active shopping list if none exists
      shoppingList = await ShoppingList.create({
        userId: req.user._id,
        name: 'My Smart Shopping List',
        items: []
      });
    }

    res.status(200).json({ success: true, data: shoppingList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add manual item to shopping list
// @route   POST /api/shopping-lists/items
// @access  Private
const addShoppingItem = async (req, res) => {
  try {
    const { name, quantity, unit, itemId } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide item name' });
    }

    let shoppingList = await ShoppingList.findOne({
      userId: req.user._id,
      status: 'active'
    });

    if (!shoppingList) {
      shoppingList = await ShoppingList.create({
        userId: req.user._id,
        name: 'My Smart Shopping List',
        items: []
      });
    }

    // Check if item already exists by name or linked itemId
    const itemIndex = shoppingList.items.findIndex(
      (i) =>
        (itemId && i.itemId && i.itemId.toString() === itemId.toString()) ||
        i.name.toLowerCase() === name.toLowerCase()
    );

    if (itemIndex > -1) {
      // Update quantity
      shoppingList.items[itemIndex].quantity += parseFloat(quantity) || 1;
      shoppingList.items[itemIndex].completed = false; // reset completion
    } else {
      // Push new item
      shoppingList.items.push({
        itemId: itemId || null,
        name,
        quantity: parseFloat(quantity) || 1,
        unit: unit || 'pcs',
        completed: false
      });
    }

    const savedList = await shoppingList.save();
    res.status(200).json({ success: true, data: savedList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update shopping list item (quantity, check complete)
// @route   PUT /api/shopping-lists/items/:itemId
// @access  Private
const updateShoppingItem = async (req, res) => {
  try {
    const { quantity, completed } = req.body;
    const shoppingList = await ShoppingList.findOne({
      userId: req.user._id,
      status: 'active'
    });

    if (!shoppingList) {
      return res.status(404).json({ success: false, message: 'Shopping list not found' });
    }

    const item = shoppingList.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in shopping list' });
    }

    const wasCompleted = item.completed;

    if (quantity !== undefined) item.quantity = parseFloat(quantity);
    if (completed !== undefined) item.completed = completed;

    // Check-off triggers automatic inventory restocking!
    if (completed === true && !wasCompleted && item.itemId) {
      // Find linked grocery item
      const grocery = await Grocery.findOne({ _id: item.itemId, userId: req.user._id });
      if (grocery) {
        grocery.quantity = parseFloat((grocery.quantity + item.quantity).toFixed(2));
        await grocery.save();

        // Log transaction
        await Transaction.create({
          userId: req.user._id,
          groceryItemId: grocery._id,
          type: 'PURCHASE',
          quantity: item.quantity,
          reason: 'Restocked from shopping list check-off'
        });
      }
    }

    await shoppingList.save();
    res.status(200).json({ success: true, data: shoppingList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete item from shopping list
// @route   DELETE /api/shopping-lists/items/:itemId
// @access  Private
const deleteShoppingItem = async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({
      userId: req.user._id,
      status: 'active'
    });

    if (!shoppingList) {
      return res.status(404).json({ success: false, message: 'Shopping list not found' });
    }

    // Remove sub-document
    shoppingList.items.pull({ _id: req.params.itemId });
    await shoppingList.save();

    res.status(200).json({ success: true, data: shoppingList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getShoppingList,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem
};
