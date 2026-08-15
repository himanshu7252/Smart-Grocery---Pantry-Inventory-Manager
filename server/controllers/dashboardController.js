const Grocery = require('../models/Grocery.js');
const Transaction = require('../models/Transaction.js');
const ShoppingList = require('../models/ShoppingList.js');

// @desc    Get dashboard metrics summary
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // 1. Total items count
    const totalItems = await Grocery.countDocuments({ userId });

    // 2. Low stock count
    const lowStockCount = await Grocery.countDocuments({
      userId,
      minimumStock: { $gt: 0 },
      $expr: { $lte: ['$quantity', '$minimumStock'] }
    });

    // 3. Expiring soon count (next 3 days)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);
    const expiringSoonCount = await Grocery.countDocuments({
      userId,
      expiryDate: { $gte: now, $lte: threeDaysLater }
    });

    // 4. Expired count
    const expiredCount = await Grocery.countDocuments({
      userId,
      expiryDate: { $lt: now }
    });

    // 5. Shopping items count (uncompleted)
    const activeList = await ShoppingList.findOne({ userId, status: 'active' });
    const shoppingItemsCount = activeList
      ? activeList.items.filter((item) => !item.completed).length
      : 0;

    // 6. Estimated inventory value
    const groceries = await Grocery.find({ userId });
    const inventoryValue = groceries.reduce(
      (acc, item) => acc + (item.quantity * item.purchasePrice || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        lowStockCount,
        expiringSoonCount,
        expiredCount,
        shoppingItemsCount,
        inventoryValue: parseFloat(inventoryValue.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get inventory charts analytics data
// @route   GET /api/dashboard/analytics
// @access  Private
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Items count & value breakdown by Category
    const categoryBreakdown = await Grocery.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } }
        }
      },
      { $project: { _id: 1, count: 1, totalQuantity: 1, totalValue: { $round: ['$totalValue', 2] } } }
    ]);

    // 2. Spending trends - sum of 'PURCHASE' transactions grouped by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const spendingTrends = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'PURCHASE',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $lookup: {
          from: 'groceries',
          localField: 'groceryItemId',
          foreignField: '_id',
          as: 'grocery'
        }
      },
      { $unwind: '$grocery' },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSpend: { $sum: { $multiply: ['$quantity', '$grocery.purchasePrice'] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 3. Stock activity totals (Consumption vs Waste vs Purchases) in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityStats = await Transaction.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$type',
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        categoryBreakdown,
        spendingTrends,
        activityStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Calculate restock predictions based on consumption trends
// @route   GET /api/dashboard/restock-predictions
// @access  Private
const getRestockPredictions = async (req, res) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all grocery items
    const groceries = await Grocery.find({ userId });
    const predictions = [];

    for (const item of groceries) {
      // Find consumption logs in the last 30 days
      const consumptions = await Transaction.find({
        userId,
        groceryItemId: item._id,
        type: 'CONSUMPTION',
        createdAt: { $gte: thirtyDaysAgo }
      }).sort({ createdAt: 1 });

      if (consumptions.length < 2) {
        // Not enough history
        predictions.push({
          itemId: item._id,
          name: item.name,
          category: item.category,
          currentQuantity: item.quantity,
          unit: item.unit,
          avgDailyConsumption: 0,
          daysRemaining: null,
          message: 'Insufficient consumption logs'
        });
        continue;
      }

      // Calculate total consumption quantity
      const totalConsumed = consumptions.reduce((sum, trans) => sum + trans.quantity, 0);

      // Find time interval between first and last consumption record
      const firstDate = new Date(consumptions[0].createdAt);
      const lastDate = new Date(consumptions[consumptions.length - 1].createdAt);
      const diffTime = Math.abs(lastDate - firstDate);
      const daysRange = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // Calculate average consumption rate per day
      const avgDailyConsumption = parseFloat((totalConsumed / daysRange).toFixed(3));

      // Calculate days remaining
      let daysRemaining = null;
      let message = 'Stable stock';

      if (avgDailyConsumption > 0) {
        daysRemaining = parseFloat((item.quantity / avgDailyConsumption).toFixed(1));
        if (daysRemaining <= 0) {
          message = 'Out of stock';
        } else if (daysRemaining <= 3) {
          message = 'Restock urgently';
        } else if (daysRemaining <= 7) {
          message = 'Restock soon';
        }
      } else {
        message = 'No consumption';
      }

      predictions.push({
        itemId: item._id,
        name: item.name,
        category: item.category,
        currentQuantity: item.quantity,
        unit: item.unit,
        avgDailyConsumption,
        daysRemaining,
        message
      });
    }

    res.status(200).json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardSummary,
  getDashboardAnalytics,
  getRestockPredictions
};
