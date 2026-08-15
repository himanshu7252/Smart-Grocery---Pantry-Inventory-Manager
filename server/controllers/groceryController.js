const Grocery = require('../models/Grocery.js');
const Transaction = require('../models/Transaction.js');
const { checkAlertsAndSyncShoppingList } = require('../services/alertService.js');

// @desc    Get all grocery items (with search, filter, sort)
// @route   GET /api/inventory
// @access  Private
const getGroceries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, category, filter, sort } = req.query;

    // Build query object
    let query = { userId };

    // Search filter (name, brand, barcode)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Smart status filters
    const now = new Date();
    if (filter) {
      if (filter === 'lowStock') {
        // quantity <= minimumStock and minimumStock > 0
        query.$expr = {
          $and: [
            { $gt: ['$minimumStock', 0] },
            { $lte: ['$quantity', '$minimumStock'] }
          ]
        };
      } else if (filter === 'expiringSoon') {
        // expiryDate within 3 days and >= now
        const threeDaysLater = new Date();
        threeDaysLater.setDate(now.getDate() + 3);
        query.expiryDate = { $gte: now, $lte: threeDaysLater };
      } else if (filter === 'expired') {
        // expiryDate < now
        query.expiryDate = { $lt: now };
      } else if (filter === 'available') {
        query.quantity = { $gt: 0 };
      } else if (filter === 'outOfStock') {
        query.quantity = 0;
      }
    }

    // Sorting definition
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case 'expiryDate':
          sortOption = { expiryDate: 1 }; // closest expiry first
          break;
        case 'quantity':
          sortOption = { quantity: -1 }; // high to low
          break;
        case 'price':
          sortOption = { purchasePrice: -1 }; // expensive first
          break;
        case 'alphabetical':
          sortOption = { name: 1 };
          break;
        case 'recentlyAdded':
        default:
          sortOption = { createdAt: -1 };
          break;
      }
    } else {
      sortOption = { createdAt: -1 };
    }

    const groceries = await Grocery.find(query).sort(sortOption);
    res.status(200).json({ success: true, count: groceries.length, data: groceries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single grocery item
// @route   GET /api/inventory/:id
// @access  Private
const getGroceryById = async (req, res) => {
  try {
    const grocery = await Grocery.findOne({ _id: req.params.id, userId: req.user._id });
    if (!grocery) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }
    res.status(200).json({ success: true, data: grocery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a grocery item
// @route   POST /api/inventory
// @access  Private
const createGrocery = async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      quantity,
      unit,
      minimumStock,
      purchasePrice,
      expiryDate,
      barcode,
      location,
      notes
    } = req.body;

    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least a product name and unit type'
      });
    }

    const grocery = await Grocery.create({
      userId: req.user._id,
      name,
      category: category || 'Other',
      brand: brand || '',
      quantity: quantity || 0,
      unit,
      minimumStock: minimumStock || 0,
      purchasePrice: purchasePrice || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      barcode: barcode || '',
      location: location || '',
      notes: notes || ''
    });

    // Record initial Transaction log
    if (grocery.quantity > 0) {
      await Transaction.create({
        userId: req.user._id,
        groceryItemId: grocery._id,
        type: 'PURCHASE',
        quantity: grocery.quantity,
        reason: 'Initial stock addition'
      });
    }

    // Trigger alerts checks
    await checkAlertsAndSyncShoppingList(grocery);

    res.status(201).json({ success: true, data: grocery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update grocery item parameters
// @route   PUT /api/inventory/:id
// @access  Private
const updateGrocery = async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      quantity,
      unit,
      minimumStock,
      purchasePrice,
      expiryDate,
      barcode,
      location,
      notes
    } = req.body;

    let grocery = await Grocery.findOne({ _id: req.params.id, userId: req.user._id });
    if (!grocery) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }

    const oldQuantity = grocery.quantity;

    // Apply updates
    grocery.name = name !== undefined ? name : grocery.name;
    grocery.category = category !== undefined ? category : grocery.category;
    grocery.brand = brand !== undefined ? brand : grocery.brand;
    grocery.quantity = quantity !== undefined ? quantity : grocery.quantity;
    grocery.unit = unit !== undefined ? unit : grocery.unit;
    grocery.minimumStock = minimumStock !== undefined ? minimumStock : grocery.minimumStock;
    grocery.purchasePrice = purchasePrice !== undefined ? purchasePrice : grocery.purchasePrice;
    grocery.expiryDate = expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : grocery.expiryDate;
    grocery.barcode = barcode !== undefined ? barcode : grocery.barcode;
    grocery.location = location !== undefined ? location : grocery.location;
    grocery.notes = notes !== undefined ? notes : grocery.notes;

    const savedGrocery = await grocery.save();

    // Check if quantity changed to record transaction adjustments
    if (quantity !== undefined && quantity !== oldQuantity) {
      const difference = quantity - oldQuantity;
      await Transaction.create({
        userId: req.user._id,
        groceryItemId: savedGrocery._id,
        type: difference > 0 ? 'PURCHASE' : 'ADJUSTMENT',
        quantity: Math.abs(difference),
        reason: 'Manual quantity adjustment'
      });
    }

    // Trigger alerts check
    await checkAlertsAndSyncShoppingList(savedGrocery);

    res.status(200).json({ success: true, data: savedGrocery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete grocery item
// @route   DELETE /api/inventory/:id
// @access  Private
const deleteGrocery = async (req, res) => {
  try {
    const grocery = await Grocery.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!grocery) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }

    // Clean up related transactions & notifications if desired, or keep them.
    // For local database simplicity, we can let transactions cascade or remain.
    res.status(200).json({ success: true, message: 'Grocery item removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Consume grocery (decrement quantity)
// @route   POST /api/inventory/:id/consume
// @access  Private
const consumeGrocery = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const consumeAmount = parseFloat(amount);

    if (isNaN(consumeAmount) || consumeAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid positive consumption amount' });
    }

    let grocery = await Grocery.findOne({ _id: req.params.id, userId: req.user._id });
    if (!grocery) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }

    if (grocery.quantity < consumeAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Current stock is ${grocery.quantity} ${grocery.unit}, requested consumption is ${consumeAmount} ${grocery.unit}`
      });
    }

    grocery.quantity = parseFloat((grocery.quantity - consumeAmount).toFixed(2));
    const savedGrocery = await grocery.save();

    // Record Transaction
    await Transaction.create({
      userId: req.user._id,
      groceryItemId: grocery._id,
      type: reason === 'waste' ? 'WASTE' : 'CONSUMPTION',
      quantity: consumeAmount,
      reason: reason || 'Grocery consumption'
    });

    // Check alerts and update shopping list
    await checkAlertsAndSyncShoppingList(savedGrocery);

    res.status(200).json({ success: true, data: savedGrocery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Purchase grocery (increment quantity)
// @route   POST /api/inventory/:id/purchase
// @access  Private
const purchaseGrocery = async (req, res) => {
  try {
    const { amount, price, reason } = req.body;
    const purchaseAmount = parseFloat(amount);

    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid positive purchase amount' });
    }

    let grocery = await Grocery.findOne({ _id: req.params.id, userId: req.user._id });
    if (!grocery) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }

    grocery.quantity = parseFloat((grocery.quantity + purchaseAmount).toFixed(2));
    if (price && parseFloat(price) > 0) {
      grocery.purchasePrice = parseFloat(price);
    }
    const savedGrocery = await grocery.save();

    // Record Transaction
    await Transaction.create({
      userId: req.user._id,
      groceryItemId: grocery._id,
      type: 'PURCHASE',
      quantity: purchaseAmount,
      reason: reason || 'Grocery replenishment purchase'
    });

    // Check alerts
    await checkAlertsAndSyncShoppingList(savedGrocery);

    res.status(200).json({ success: true, data: savedGrocery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get grocery item transaction history
// @route   GET /api/inventory/:id/history
// @access  Private
const getGroceryHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
      groceryItemId: req.params.id
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGroceries,
  getGroceryById,
  createGrocery,
  updateGrocery,
  deleteGrocery,
  consumeGrocery,
  purchaseGrocery,
  getGroceryHistory
};
