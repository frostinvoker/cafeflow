import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    unit: { type: String, trim: true, default: 'pcs' },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    price: { type: Number, min: 0 },
    available: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Inventory', InventorySchema);
