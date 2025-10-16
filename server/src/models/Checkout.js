const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }
  ],
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false // ✅ optional for seeding
  },
  date: {
    type: Date,
    default: Date.now
  },
  total: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Checkout', checkoutSchema);