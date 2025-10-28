// models/MenuItem.js
import mongoose from 'mongoose';

const SizePricesSchema = new mongoose.Schema(
  {
    oz12: { type: Number, min: 0 },
    oz16: { type: Number, min: 0 },
  },
  { _id: false }
);

const MenuItemSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['Drinks', 'Snacks', 'Meals'], default: 'Drinks' },

    name: { type: String, required: true, trim: true, unique: true },

    // Single price required for NON-Drinks
    price: {
      type: Number,
      min: 0,
      required: function () {
        return (this.category || '').toLowerCase() !== 'drinks';
      },
    },

    // Size prices required for Drinks; must have BOTH oz12 and oz16
    sizePrices: {
      type: SizePricesSchema,
      validate: {
        validator: function (v) {
          const isDrink = (this.category || '').toLowerCase() === 'drinks';
          if (isDrink) {
            return (
              v &&
              typeof v.oz12 === 'number' &&
              v.oz12 >= 0 &&
              typeof v.oz16 === 'number' &&
              v.oz16 >= 0
            );
          }
          // Non-drinks should NOT include sizePrices
          return v == null;
        },
        message:
          'Drinks must include sizePrices.oz12 and sizePrices.oz16; non-drinks must not include sizePrices.',
      },
    },

    available: { type: Boolean, default: true },

    ingredients: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true }],
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: 'Select at least one ingredient.',
      },
      required: true,
    },

    allowedAddOns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }],
  },
  { timestamps: true, versionKey: false }
);

MenuItemSchema.index({ ingredients: 1 });

export default mongoose.model('MenuItem', MenuItemSchema);
