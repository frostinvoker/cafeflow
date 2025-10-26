import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema(
  { _id: String, seq: { type: Number, default: 0 } },
  { versionKey: false }
);
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

const AddOnSnapshotSchema = new mongoose.Schema(
  {
    addon: { type: mongoose.Schema.Types.ObjectId, ref: 'AddOn', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const LineItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addons: { type: [AddOnSnapshotSchema], default: [] },
    lineDiscount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },

  },
  { _id: false }
);

const CheckoutSchema = new mongoose.Schema(
  {
    items: { type: [LineItemSchema], default: [] },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },

    customerSnapshot: {
      name:  { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true }
    },

    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash','gcash'], default: 'cash' },

    payment: {
      tendered: { type: Number, default: 0, min: 0 },
      change: { type: Number, default: 0, min: 0 },
      referenceId: { type: String, trim: true }
    },
    receiptNo: { type: Number, index: true, unique: true },
    subtotal: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, default: 0, min: 0 },

    //Loyalty Pts
    pointsEarned: { type: Number, default: 0, min: 0 },
    pointsSpent:  { type: Number, default: 0, min: 0 },
    orderType:  { type: String, enum: ['dinein','takeout'], default: 'takeout' },
    printCount: { type: Number, default: 0, min: 0 },
    lastPrintedAt: { type: Date }
  },
  { timestamps: true, versionKey: false }
);

CheckoutSchema.pre('validate', function (next) {
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
