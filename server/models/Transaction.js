const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    groceryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grocery',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['PURCHASE', 'CONSUMPTION', 'ADJUSTMENT', 'WASTE']
    },
    quantity: {
      type: Number,
      required: [true, 'Please specify quantity changed'],
      min: [0.01, 'Quantity change must be positive']
    },
    reason: {
      type: String,
      trim: true,
      default: '' // e.g. "Dinner preparation", "Expired item", "Inaccurate count"
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Only need when transaction occurred
  }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
