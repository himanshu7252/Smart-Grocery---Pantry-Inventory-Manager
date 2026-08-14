const mongoose = require('mongoose');

const FamilySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a family group name'],
      trim: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Family', FamilySchema);
