const Notification = require('../models/Notification.js');
const ShoppingList = require('../models/ShoppingList.js');

/**
 * Checks stock level and expiry dates for a grocery item,
 * generating notifications and automatically updating the shopping list if necessary.
 * @param {Object} item - Mongoose Grocery item document
 */
const checkAlertsAndSyncShoppingList = async (item) => {
  try {
    const userId = item.userId;
    const now = new Date();

    // -------------------------------------------------------------
    // 1. LOW STOCK ALERT & AUTOMATIC SHOPPING LIST INJECTION
    // -------------------------------------------------------------
    if (item.quantity <= item.minimumStock && item.minimumStock > 0) {
      // Create LOW_STOCK notification if not already created (unread)
      const existingNotification = await Notification.findOne({
        userId,
        relatedItemId: item._id,
        type: 'LOW_STOCK',
        read: false
      });

      if (!existingNotification) {
        await Notification.create({
          userId,
          type: 'LOW_STOCK',
          title: `Low Stock: ${item.name}`,
          message: `${item.name} is running low! Current quantity is ${item.quantity} ${item.unit} (Minimum: ${item.minimumStock} ${item.unit})`,
          relatedItemId: item._id
        });
      }

      // Add/Update in Smart Shopping List
      let shoppingList = await ShoppingList.findOne({ userId, status: 'active' });
      if (!shoppingList) {
        shoppingList = await ShoppingList.create({
          userId,
          name: 'Smart Grocery Shopping List',
          items: []
        });
      }

      // Calculate required restock quantity: Target Stock (double minimum stock) - Current Quantity
      const targetStock = item.minimumStock * 2;
      const restockQty = Math.max(0.1, targetStock - item.quantity);

      // Check if item is already in the shopping list
      const itemIndex = shoppingList.items.findIndex(
        (i) => i.itemId && i.itemId.toString() === item._id.toString()
      );

      if (itemIndex > -1) {
        // If not completed, update quantity, otherwise reset completed state and update
        const listItem = shoppingList.items[itemIndex];
        if (listItem.completed) {
          listItem.completed = false;
          listItem.quantity = restockQty;
        } else {
          listItem.quantity = Math.max(listItem.quantity, restockQty);
        }
      } else {
        // Add new item
        shoppingList.items.push({
          itemId: item._id,
          name: item.name,
          quantity: restockQty,
          unit: item.unit,
          completed: false
        });
      }

      await shoppingList.save();
    } else {
      // If stock is healthy, we can check if it's in the shopping list and auto-complete or do nothing.
      // Typically, let's leave it as is, or we can remove it if we want.
    }

    // -------------------------------------------------------------
    // 2. EXPIRY ALERTS
    // -------------------------------------------------------------
    if (item.expiryDate) {
      const expiry = new Date(item.expiryDate);
      const diffTime = expiry - now;
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        // EXPIRED
        const existingExpiredNotif = await Notification.findOne({
          userId,
          relatedItemId: item._id,
          type: 'EXPIRED',
          read: false
        });

        if (!existingExpiredNotif) {
          await Notification.create({
            userId,
            type: 'EXPIRED',
            title: `Expired Product: ${item.name}`,
            message: `${item.name} expired on ${expiry.toLocaleDateString()}`,
            relatedItemId: item._id
          });
        }
      } else if (daysUntilExpiry <= 3) {
        // EXPIRY SOON
        const existingSoonNotif = await Notification.findOne({
          userId,
          relatedItemId: item._id,
          type: 'EXPIRY_SOON',
          read: false
        });

        if (!existingSoonNotif) {
          await Notification.create({
            userId,
            type: 'EXPIRY_SOON',
            title: `Expiring Soon: ${item.name}`,
            message: `${item.name} expires in ${daysUntilExpiry} days (${expiry.toLocaleDateString()})`,
            relatedItemId: item._id
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error in checkAlertsAndSyncShoppingList: ${error.message}`);
  }
};

module.exports = { checkAlertsAndSyncShoppingList };
