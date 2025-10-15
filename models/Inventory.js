const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Optional: Automatically update 'lastUpdated' whenever the document changes
inventorySchema.pre('save', function (next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
