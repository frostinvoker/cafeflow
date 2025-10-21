// Customer model: stores basic customer info and loyalty points.
import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    // Full name used in POS/receipts
    name: { type: String, required: true, trim: true },

    // Optional email for receipts/promotions
    email: { type: String, trim: true, lowercase: true },

    // Simple points balance; business logic can update on checkout
    loyaltyPoints: { type: Number, default: 0, min: 0 },
  },
  // Created/updated timestamps; skip __v
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Customer', CustomerSchema);
