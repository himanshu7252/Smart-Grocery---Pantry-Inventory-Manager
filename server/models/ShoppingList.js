const mongoose = require('mongoose');

const ShoppingListItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grocery',
    default: null
  },
  name: {
    type: String,
    required: [true, 'Please add item name'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please specify quantity'],
    min: [0.01, 'Quantity must be greater than zero'],
    default: 1
  },
  unit: {
    type: String,
    default: 'pcs'
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const ShoppingListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      default: 'My Shopping List',
      trim: true
    },
    items: [ShoppingListItemSchema],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    },
    shared: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ShoppingList', ShoppingListSchema);
