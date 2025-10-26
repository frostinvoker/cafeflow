import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Customer', CustomerSchema);
