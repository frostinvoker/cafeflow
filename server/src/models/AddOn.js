import mongoose from 'mongoose';

const AddOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    category: { type: String, enum: ['Drinks', 'Snacks', 'Meals'], default: 'Drinks' },
    
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('AddOn', AddOnSchema);

