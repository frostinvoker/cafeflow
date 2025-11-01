import mongoose from 'mongoose';

const q3 = n => { const x = Number(n); return Number.isFinite(x) ? Math.round((x + Number.EPSILON) * 1_000) / 1_000 : 0; };
const q2 = n => { const x = Number(n); return Number.isFinite(x) ? Math.round((x + Number.EPSILON) * 100) / 100 : 0; };

const SizePricesSchema = new mongoose.Schema(
  { oz12: { type: Number, min: 0, set: q2 }, oz16: { type: Number, min: 0, set: q2 } },
  { _id: false }
);

const RecipeEntrySchema = new mongoose.Schema(
  {
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    qtyPerUnit: { type: Number, min: 0, default: 0, set: q3 },
    perSize: {
      oz12: { type: Number, min: 0, set: q3 },
      oz16: { type: Number, min: 0, set: q3 },
    },
  },
  { _id: false }
);

const MenuItemSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['Drinks', 'Snacks', 'Meals'], default: 'Drinks' },
    name: { type: String, required: true, trim: true, unique: true },
    price: {
      type: Number, min: 0,
      required: function () { return (this.category || '').toLowerCase() !== 'drinks'; },
    },
    sizePrices: {
      type: SizePricesSchema,
      validate: {
        validator: function (v) {
          const isDrink = (this.category || '').toLowerCase() === 'drinks';
          if (isDrink) return v && typeof v.oz12 === 'number' && v.oz12 >= 0 && typeof v.oz16 === 'number' && v.oz16 >= 0;
          return v == null;
        },
        message: 'Drinks must include sizePrices.oz12 and sizePrices.oz16; non-drinks must not include sizePrices.',
      },
    },

    available: { type: Boolean, default: true },

    ingredients: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true }],
      validate: { validator(arr){ return Array.isArray(arr) && arr.length > 0; }, message: 'Select at least one ingredient.' },
      required: true,
    },
    allowedAddOns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }],
    recipe: { type: [RecipeEntrySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

MenuItemSchema.index({ ingredients: 1 });

export default mongoose.model('MenuItem', MenuItemSchema);
