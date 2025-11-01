  import mongoose from 'mongoose';
  const q3 = n => {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round((x + Number.EPSILON) * 1_000) / 1_000;
  };
  const q2 = n => {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round((x + Number.EPSILON) * 100) / 100;
  };

  const InventorySchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, unique: true },
      unit: { type: String, trim: true, default: 'pcs' },
      quantity: { type: Number, required: true, default: 0, min: 0, set: q3 },
      price: { type: Number, min: 0, set: q2 },
      available: { type: Boolean, default: true },
      lowStockThreshold: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true, versionKey: false }
  );

  export default mongoose.model('Inventory', InventorySchema);
