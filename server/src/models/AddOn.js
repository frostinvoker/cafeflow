// AddOn model: represents extra options that can be added to drinks
// (e.g., extra shot, syrups, alternative milk) with pricing.
import mongoose from 'mongoose';

const AddOnSchema = new mongoose.Schema(
  {
    // Display name of the add-on (e.g., "Extra Shot", "Vanilla Syrup")
    name: { type: String, required: true, trim: true, unique: true },

    // Price for a single unit of this add-on
    price: { type: Number, required: true, min: 0 },

    // Whether this add-on is available in POS
    active: { type: Boolean, default: true },

    // Limit application to drinks only (kept explicit for future extensibility)
    applicableTo: { type: String, enum: ['drink'], default: 'drink' },

    // Optional notes or description for staff
    notes: { type: String, trim: true }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('AddOn', AddOnSchema);

