// MenuItem model: represents POS menu entries (e.g., Latte, Muffin)
// Includes basic catalog fields and an availability toggle for quick hides.
import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema(
  {
    // Category for grouping (e.g., "Coffee", "Food")
    category: { type: String, enum: ['Drinks', 'Snacks', 'Meals'], default: 'Drinks' },

    // Display name; unique to prevent duplicates (e.g., "Caffe Latte")
    name: { type: String, required: true, trim: true, unique: true },

    // Current price in your base currency
    price: { type: Number, required: true, min: 0 },
    // Quick toggle without deleting the item
    available: { type: Boolean, default: true },

    ingredients: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true }],
      validate: {
        validator(arr) { return Array.isArray(arr) && arr.length > 0; },
        message: 'Select at least one ingredient.',
      },
      required: true,
    },

    // Optional restriction list: if provided, only these AddOns can be used
    // with this menu item. If empty/missing, any active 'drink' add-ons are
    // allowed (still constrained by itemType === 'drink').
    allowedAddOns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }]
  },
  // Created/updated timestamps; skip __v
  { timestamps: true, versionKey: false }
);
MenuItemSchema.index({ ingredients: 1 });
export default mongoose.model('MenuItem', MenuItemSchema);
