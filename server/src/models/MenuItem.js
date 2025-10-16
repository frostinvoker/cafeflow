const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true // prevent duplicate menu items
  },
  price: {
    type: Number,
    required: true,
    min: 0 // price can't be negative
  },
  available: {
    type: Boolean,
    default: true // mark items unavailable without deleting them
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);