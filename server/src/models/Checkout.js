// Checkout model: one POS transaction (aka order/receipt).
// Stores line items with a snapshot of menu names/prices at the time.
import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema(
  { _id: String, seq: { type: Number, default: 0 } },
  { versionKey: false }
);
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

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
    lineDiscount: { type: Number, default: 0, min: 0 },
    // Derived: (price + sum(addons.price)) * quantity
    subtotal: { type: Number, required: true, min: 0 },

  },
  { _id: false }
);

const CheckoutSchema = new mongoose.Schema(
  {
    // List of purchased items
    items: { type: [LineItemSchema], default: [] },

    // Optional reference to a known customer
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },

    customerSnapshot: {
      name:  { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true }
    },
    
    // Current lifecycle state of the transaction
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },

    // Optional: cash, card, gcash, etc.
    paymentMethod: { type: String, enum: ['cash','gcash'], default: 'cash' },

    payment: {
      tendered: { type: Number, default: 0, min: 0 },
      change: { type: Number, default: 0, min: 0 },
      referenceId: { type: String, trim: true }
    },
    receiptNo: { type: Number, index: true, unique: true },

    subtotal: { type: Number, required: true, default: 0, min: 0 },
    // Sum of all line item subtotals
    total: { type: Number, required: true, default: 0, min: 0 },

    //Loyalty Pts
    pointsEarned: { type: Number, default: 0, min: 0 },
    pointsSpent:  { type: Number, default: 0, min: 0 },
    orderType:  { type: String, enum: ['dinein','takeout'], default: 'takeout' },
    printCount: { type: Number, default: 0, min: 0 },
    lastPrintedAt: { type: Date }
  },
  // Created/updated timestamps; skip __v
  { timestamps: true, versionKey: false }
);

// Keep totals consistent based on items
CheckoutSchema.pre('validate', function (next) {
  //line subtotal
  for (const it of this.items || []) {
    const base = Number(it.price) || 0;
    const addons = (it.addons || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
    const lineDisc = Number(it.lineDiscount) || 0;
    const qty = Math.max(1, Number(it.quantity) || 1);
    it.subtotal = Math.max(0, (base + addons - lineDisc)) * qty;
  }
  this.subtotal = (this.items || []).reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
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

CheckoutSchema.pre('save', async function (next) {
  if (this.isNew && !this.receiptNo) {
    const c = await Counter.findByIdAndUpdate(
      'receiptNo',
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    this.receiptNo = c.seq;
  }
  next();
});

CheckoutSchema.index({ createdAt: -1 });
CheckoutSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Checkout || mongoose.model('Checkout', CheckoutSchema);
