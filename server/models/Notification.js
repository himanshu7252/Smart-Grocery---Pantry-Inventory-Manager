const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['LOW_STOCK', 'EXPIRY_SOON', 'EXPIRED', 'RESTOCK']
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    relatedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grocery',
      default: null
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

// Index to quickly fetch unread notifications for a user
NotificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
