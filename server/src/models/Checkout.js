// Checkout model: one POS transaction (aka order/receipt).
// Stores line items with a snapshot of menu names/prices at the time.
import mongoose from 'mongoose';

// Embedded schema for add-on snapshot on a line item
const AddOnSnapshotSchema = new mongoose.Schema(
  {
    addon: { type: mongoose.Schema.Types.ObjectId, ref: 'AddOn', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

// Embedded schema for a single line of the receipt
const LineItemSchema = new mongoose.Schema(
  {
    // Reference to the menu item ordered
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },

    // Snapshot of the menu item name at checkout time
    name: { type: String, required: true, trim: true },

    // Unit price captured at checkout time
    price: { type: Number, required: true, min: 0 },

    // Quantity of the item ordered
    quantity: { type: Number, required: true, min: 1, default: 1 },

    // Optional add-ons applied to this item (drinks only)
    addons: { type: [AddOnSnapshotSchema], default: [] },

    // Derived: (price + sum(addons.price)) * quantity
    subtotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const CheckoutSchema = new mongoose.Schema(
  {
    // List of purchased items
    items: { type: [LineItemSchema], default: [] },

    // Optional reference to a known customer
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },

    // Current lifecycle state of the transaction
    status: { type: String, enum: ['pending', 'paid', 'void', 'refunded'], default: 'paid' },

    // Optional: cash, card, gcash, etc.
    paymentMethod: { type: String, trim: true },

    // Sum of all line item subtotals
    total: { type: Number, required: true, default: 0, min: 0 },

    // Free-form notes; e.g., discounts or special requests
    notes: { type: String, trim: true }
  },
  // Created/updated timestamps; skip __v
  { timestamps: true, versionKey: false }
);

// Keep totals consistent based on items
CheckoutSchema.pre('validate', function (next) {
  if (Array.isArray(this.items)) {
    this.items.forEach((it) => {
      const base = Number(it.price) || 0;
      const addonsTotal = (it.addons || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
      const qty = Number(it.quantity) || 0;
      it.subtotal = (base + addonsTotal) * qty;
    });
  }
  this.total = (this.items || []).reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);
  next();
});

export default mongoose.model('Checkout', CheckoutSchema);
