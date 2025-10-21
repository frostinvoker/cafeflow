// Inventory model: tracks stock like milk, beans, cups, etc.
// Captures units and availability for POS/management views.
import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema(
  {
    // Unique item name (e.g., "Whole Milk", "Arabica Beans")
    name: { type: String, required: true, trim: true, unique: true },

    // Unit of measure (e.g., ml, g, pcs)
    unit: { type: String, trim: true, default: 'pcs' },

    // Current on-hand quantity
    quantity: { type: Number, required: true, default: 0, min: 0 },

    // Optional price per unit for reference
    price: { type: Number, min: 0 },

    // Toggle visibility/usage in POS
    available: { type: Boolean, default: true },

    // Threshold for low-stock warnings in UI
    lowStockThreshold: { type: Number, default: 0, min: 0 },
  },
  // Created/updated timestamps; skip __v
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Inventory', InventorySchema);
