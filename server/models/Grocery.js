const mongoose = require('mongoose');

const GrocerySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please add product name'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Vegetables',
        'Fruits',
        'Dairy',
        'Grains',
        'Snacks',
        'Beverages',
        'Meat',
        'Frozen',
        'Household',
        'Other'
      ],
      default: 'Other'
    },
    brand: {
      type: String,
      trim: true,
      default: ''
    },
    quantity: {
      type: Number,
      required: [true, 'Please specify quantity'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    unit: {
      type: String,
      required: [true, 'Please specify unit (e.g. kg, L, pcs)'],
      trim: true,
      default: 'pcs'
    },
    minimumStock: {
      type: Number,
      min: [0, 'Minimum stock level cannot be negative'],
      default: 0
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
      default: 0
    },
    expiryDate: {
      type: Date,
      default: null
    },
    barcode: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: String,
      trim: true,
      default: '' // Pantry, Fridge, Cabinet, Freezer, etc.
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index to optimize queries searching by user and filtering by barcode/category
GrocerySchema.index({ userId: 1, category: 1 });
GrocerySchema.index({ userId: 1, barcode: 1 });

module.exports = mongoose.model('Grocery', GrocerySchema);
